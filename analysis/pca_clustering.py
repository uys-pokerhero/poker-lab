"""PCA and clustering analysis for poker starting-hand betting profiles.

Input CSV format:
    - One row per starting hand (e.g. AA, AKs, KQ, ...)
    - One column 'hand' with the hand label
    - Numeric columns x01, x02, ... representing nodes in a game tree
      (typically 36 columns, but the script auto-detects any x.. columns)
    - Row weights come from analysis/hand_combos.csv, using combos / 1326
    - Feature weights come from analysis/node_probabilities.csv

Outputs:
    output/pca/         Scree, hand biplot, node biplot, combined biplot
    output/clustering/  Elbow / silhouette / dendrogram plots and cluster CSVs

Run from the repo root:
    python analysis/pca_clustering.py
    python analysis/pca_clustering.py --input path/to/your.csv
    python analysis/pca_clustering.py --hand-combos path/to/combos.csv
    python analysis/pca_clustering.py --node-probabilities path/to/probs.csv
"""

from __future__ import annotations

import argparse
import contextlib
import io
import os
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from adjustText import adjust_text
from scipy.cluster.hierarchy import dendrogram, linkage

os.environ.setdefault("OMP_NUM_THREADS", "1")

from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = REPO_ROOT / "analysis" / "poker_data.csv"
DEFAULT_HAND_COMBOS = REPO_ROOT / "analysis" / "hand_combos.csv"
DEFAULT_NODE_PROBS = REPO_ROOT / "analysis" / "node_probabilities.csv"
OUTPUT_ROOT = REPO_ROOT / "output"
PCA_DIR = OUTPUT_ROOT / "pca"
CLUSTER_DIR = OUTPUT_ROOT / "clustering"

DPI = 150

# Fixed number of hand groups (set after inspecting elbow / silhouette plots).
HANDS_K = 6


# --------------------------------------------------------------------------- #
# Data loading                                                                 #
# --------------------------------------------------------------------------- #
def normalize_weights(weights: np.ndarray, label: str) -> np.ndarray:
    """Return positive weights normalized to sum to 1."""
    weights = np.asarray(weights, dtype=float)
    if weights.ndim != 1:
        raise ValueError(f"{label} weights must be one-dimensional.")
    if np.any(~np.isfinite(weights)) or np.any(weights <= 0):
        raise ValueError(f"{label} weights must be finite positive values.")
    return weights / weights.sum()


def load_hand_weights(hand_labels: list[str], combos_path: Path) -> np.ndarray:
    """Load starting-hand probabilities from combo counts."""
    combos = pd.read_csv(combos_path)
    expected = {"hand", "combos"}
    if set(combos.columns) != expected:
        raise ValueError(f"Expected columns {sorted(expected)} in {combos_path}")

    duplicate_hands = combos.loc[combos["hand"].duplicated(), "hand"].tolist()
    if duplicate_hands:
        raise ValueError(f"Duplicate hands in {combos_path}: {duplicate_hands}")

    combo_by_hand = combos.set_index("hand")["combos"]
    missing = [hand for hand in hand_labels if hand not in combo_by_hand.index]
    if missing:
        raise ValueError(f"Missing combo counts for hands: {missing}")

    weights = combo_by_hand.loc[hand_labels].to_numpy(dtype=float) / 1326.0
    return normalize_weights(weights, "Hand")


def load_node_weights(node_cols: list[str], probabilities_path: Path) -> np.ndarray:
    """Load game-tree node reach probabilities."""
    probs = pd.read_csv(probabilities_path)
    expected = {"node", "prob"}
    if set(probs.columns) != expected:
        raise ValueError(f"Expected columns {sorted(expected)} in {probabilities_path}")

    duplicate_nodes = probs.loc[probs["node"].duplicated(), "node"].tolist()
    if duplicate_nodes:
        raise ValueError(f"Duplicate nodes in {probabilities_path}: {duplicate_nodes}")

    prob_by_node = probs.set_index("node")["prob"]
    missing = [node for node in node_cols if node not in prob_by_node.index]
    if missing:
        raise ValueError(f"Missing probabilities for nodes: {missing}")

    return normalize_weights(prob_by_node.loc[node_cols].to_numpy(dtype=float), "Node")


def weighted_standardize(matrix: np.ndarray, row_weights: np.ndarray) -> np.ndarray:
    """Standardize columns using weighted means and weighted variances."""
    row_weights = normalize_weights(row_weights, "Row")
    means = np.average(matrix, axis=0, weights=row_weights)
    centered = matrix - means
    variances = np.average(centered ** 2, axis=0, weights=row_weights)
    if np.any(variances <= 0):
        zero_var_cols = np.flatnonzero(variances <= 0).tolist()
        raise ValueError(f"Cannot standardize zero-variance columns: {zero_var_cols}")
    return centered / np.sqrt(variances)


def load_data(
    csv_path: Path,
    combos_path: Path,
    node_probabilities_path: Path,
) -> tuple[pd.DataFrame, list[str], np.ndarray, np.ndarray, np.ndarray]:
    """Load the CSV and return data, node names, scaled matrix, and weights."""
    df = pd.read_csv(csv_path)
    if "hand" not in df.columns:
        raise ValueError(f"Expected a 'hand' column in {csv_path}")

    node_cols = [c for c in df.columns if c != "hand"]
    if not node_cols:
        raise ValueError("No numeric node columns found (expected x01..x36).")

    hand_labels = df["hand"].tolist()
    hand_weights = load_hand_weights(hand_labels, combos_path)
    node_weights = load_node_weights(node_cols, node_probabilities_path)

    matrix = df[node_cols].to_numpy(dtype=float)
    scaled = weighted_standardize(matrix, hand_weights)
    return df, node_cols, scaled, hand_weights, node_weights


# --------------------------------------------------------------------------- #
# Weighted PCA                                                                 #
# --------------------------------------------------------------------------- #
class WeightedPCA:
    """PCA with row and feature weights, using an sklearn-like interface.

    The fitted SVD minimizes a weighted reconstruction objective:
        sum_i row_weight_i * sum_j feature_weight_j * error_ij^2
    """

    def __init__(
        self,
        row_weights: np.ndarray | None = None,
        feature_weights: np.ndarray | None = None,
    ) -> None:
        self.row_weights = row_weights
        self.feature_weights = feature_weights

    def fit(self, data: np.ndarray) -> "WeightedPCA":
        data = np.asarray(data, dtype=float)
        n_samples, n_features = data.shape
        row_weights = (
            np.ones(n_samples, dtype=float) / n_samples
            if self.row_weights is None
            else normalize_weights(self.row_weights, "PCA row")
        )
        feature_weights = (
            np.ones(n_features, dtype=float)
            if self.feature_weights is None
            else np.asarray(self.feature_weights, dtype=float)
        )
        if len(row_weights) != n_samples:
            raise ValueError("PCA row weights must match the number of rows.")
        if len(feature_weights) != n_features:
            raise ValueError("PCA feature weights must match the number of columns.")
        if np.any(~np.isfinite(feature_weights)) or np.any(feature_weights <= 0):
            raise ValueError("PCA feature weights must be finite positive values.")

        self.row_weights_ = row_weights
        self.feature_weights_ = feature_weights
        self.mean_ = np.average(data, axis=0, weights=row_weights)
        self.feature_scale_ = np.sqrt(feature_weights)

        centered = data - self.mean_
        weighted = centered * self.feature_scale_
        weighted = weighted * np.sqrt(row_weights)[:, np.newaxis]

        _, singular_values, components = np.linalg.svd(weighted, full_matrices=False)
        self.components_ = components
        self.singular_values_ = singular_values
        self.explained_variance_ = singular_values ** 2
        total_variance = self.explained_variance_.sum()
        self.explained_variance_ratio_ = (
            self.explained_variance_ / total_variance
            if total_variance > 0
            else np.zeros_like(self.explained_variance_)
        )
        return self

    def transform(self, data: np.ndarray) -> np.ndarray:
        data = np.asarray(data, dtype=float)
        centered = data - self.mean_
        return (centered * self.feature_scale_) @ self.components_.T

    def fit_transform(self, data: np.ndarray) -> np.ndarray:
        return self.fit(data).transform(data)


def adjust_text_quiet(*args, **kwargs) -> None:
    """Run adjustText without its occasional stdout noise."""
    random_state = np.random.get_state()
    try:
        np.random.seed(42)
        with contextlib.redirect_stdout(io.StringIO()):
            adjust_text(*args, **kwargs)
    finally:
        np.random.set_state(random_state)


# --------------------------------------------------------------------------- #
# Elbow detection                                                              #
# --------------------------------------------------------------------------- #
def detect_elbow(values: np.ndarray) -> int:
    """Return the index (0-based) of the elbow using the max-distance heuristic.

    Draws a line from the first to the last point of `values` and picks the
    point with the greatest perpendicular distance to that line.
    """
    n = len(values)
    if n < 3:
        return 0
    x = np.arange(n, dtype=float)
    p1 = np.array([x[0], values[0]])
    p2 = np.array([x[-1], values[-1]])
    line_vec = p2 - p1
    line_len = np.linalg.norm(line_vec)
    if line_len == 0:
        return 0
    distances = []
    for i in range(n):
        point = np.array([x[i], values[i]])
        diff = point - p1
        # 2D cross product magnitude.
        cross = line_vec[0] * diff[1] - line_vec[1] * diff[0]
        distances.append(abs(cross) / line_len)
    return int(np.argmax(distances))


# --------------------------------------------------------------------------- #
# Task 1: PCA                                                                  #
# --------------------------------------------------------------------------- #
def run_pca(
    scaled: np.ndarray,
    hand_labels: list[str],
    node_cols: list[str],
    hand_weights: np.ndarray,
    node_weights: np.ndarray,
) -> WeightedPCA:
    """Run PCA, write all PCA plots, and return the fitted PCA model."""
    PCA_DIR.mkdir(parents=True, exist_ok=True)

    pca = WeightedPCA(row_weights=hand_weights, feature_weights=node_weights)
    scores = pca.fit_transform(scaled)
    evr = pca.explained_variance_ratio_
    cum = np.cumsum(evr)

    pc1, pc2 = evr[0] * 100, evr[1] * 100
    print("\n=== Weighted PCA explained variance ===")
    print(f"PC1: {pc1:.2f}%")
    print(f"PC2: {pc2:.2f}%")
    print(f"PC1 + PC2: {pc1 + pc2:.2f}%")

    plot_scree(evr, cum)
    plot_hands_biplot(scores, hand_labels, evr)
    loadings = pca.components_.T * np.sqrt(pca.explained_variance_)
    plot_nodes_biplot(loadings, node_cols, evr)
    plot_combined_biplot(scores, hand_labels, loadings, node_cols, evr)
    return pca


def plot_scree(evr: np.ndarray, cum: np.ndarray) -> None:
    elbow = detect_elbow(evr)
    n = len(evr)
    x = np.arange(1, n + 1)

    fig, ax1 = plt.subplots(figsize=(10, 6))
    ax1.bar(x, evr, color="steelblue", alpha=0.75, label="Explained variance")
    ax1.set_xlabel("Principal component")
    ax1.set_ylabel("Explained variance ratio", color="steelblue")
    ax1.tick_params(axis="y", labelcolor="steelblue")
    ax1.set_xticks(x)

    ax2 = ax1.twinx()
    ax2.plot(x, cum, color="darkorange", marker="o", label="Cumulative")
    ax2.set_ylabel("Cumulative explained variance", color="darkorange")
    ax2.tick_params(axis="y", labelcolor="darkorange")
    ax2.set_ylim(0, 1.05)
    ax2.axhline(0.85, color="grey", linestyle=":", linewidth=1)
    ax2.text(n, 0.86, "85%", color="grey", ha="right", va="bottom", fontsize=9)

    elbow_pc = elbow + 1
    ax1.axvline(elbow_pc, color="red", linestyle="--", linewidth=1)
    ax1.text(
        elbow_pc, evr[elbow], f"  elbow @ PC{elbow_pc}",
        color="red", va="bottom", fontsize=9,
    )

    plt.title("PCA scree plot")
    fig.tight_layout()
    fig.savefig(PCA_DIR / "scree.png", dpi=DPI)
    plt.close(fig)


def plot_hands_biplot(scores: np.ndarray, labels: list[str], evr: np.ndarray) -> None:
    fig, ax = plt.subplots(figsize=(11, 9))
    ax.scatter(scores[:, 0], scores[:, 1], s=40, color="steelblue", alpha=0.75)
    texts = [
        ax.text(scores[i, 0], scores[i, 1], labels[i], fontsize=9)
        for i in range(len(labels))
    ]
    adjust_text_quiet(texts, ax=ax, arrowprops=dict(arrowstyle="-", color="grey", lw=0.5))
    ax.axhline(0, color="grey", lw=0.5)
    ax.axvline(0, color="grey", lw=0.5)
    ax.set_xlabel(f"PC1 ({evr[0] * 100:.1f}%)")
    ax.set_ylabel(f"PC2 ({evr[1] * 100:.1f}%)")
    ax.set_title("Hands biplot (PC1 vs PC2)")
    fig.tight_layout()
    fig.savefig(PCA_DIR / "hands_biplot.png", dpi=DPI)

    # Save a zoomed-in copy for detailed inspection of the central region.
    ax.set_xlim(-1, 1)
    ax.set_ylim(-0.5, 0.4)
    ax.set_title("Hands biplot (PC1 vs PC2) — zoomed")
    fig.tight_layout()
    fig.savefig(PCA_DIR / "hands_biplot_zoomed.png", dpi=DPI)
    plt.close(fig)


def plot_nodes_biplot(loadings: np.ndarray, node_cols: list[str], evr: np.ndarray) -> None:
    fig, ax = plt.subplots(figsize=(10, 8))
    texts = []
    for i, name in enumerate(node_cols):
        ax.arrow(
            0, 0, loadings[i, 0], loadings[i, 1],
            color="darkorange", alpha=0.7,
            head_width=0.02, length_includes_head=True,
        )
        texts.append(ax.text(loadings[i, 0], loadings[i, 1], name, fontsize=9))
    adjust_text_quiet(texts, ax=ax, arrowprops=dict(arrowstyle="-", color="grey", lw=0.4))
    ax.axhline(0, color="grey", lw=0.5)
    ax.axvline(0, color="grey", lw=0.5)
    ax.set_xlabel(f"PC1 ({evr[0] * 100:.1f}%)")
    ax.set_ylabel(f"PC2 ({evr[1] * 100:.1f}%)")
    ax.set_title("Nodes biplot — PCA loadings")
    fig.tight_layout()
    fig.savefig(PCA_DIR / "nodes_biplot.png", dpi=DPI)
    plt.close(fig)


def plot_combined_biplot(
    scores: np.ndarray,
    hand_labels: list[str],
    loadings: np.ndarray,
    node_cols: list[str],
    evr: np.ndarray,
) -> None:
    score_range = max(np.abs(scores[:, :2]).max(), 1e-9)
    load_range = max(np.abs(loadings[:, :2]).max(), 1e-9)
    scale = score_range / load_range * 0.9
    scaled_loadings = loadings[:, :2] * scale

    fig, ax = plt.subplots(figsize=(12, 10))
    ax.scatter(scores[:, 0], scores[:, 1], s=35, color="steelblue", alpha=0.7)
    hand_texts = [
        ax.text(scores[i, 0], scores[i, 1], hand_labels[i], fontsize=8, color="steelblue")
        for i in range(len(hand_labels))
    ]

    node_texts = []
    for i, name in enumerate(node_cols):
        ax.arrow(
            0, 0, scaled_loadings[i, 0], scaled_loadings[i, 1],
            color="darkorange", alpha=0.65,
            head_width=score_range * 0.012, length_includes_head=True,
        )
        node_texts.append(
            ax.text(
                scaled_loadings[i, 0], scaled_loadings[i, 1], name,
                fontsize=8, color="darkorange",
            )
        )

    adjust_text_quiet(
        hand_texts + node_texts, ax=ax,
        arrowprops=dict(arrowstyle="-", color="grey", lw=0.4),
    )
    ax.axhline(0, color="grey", lw=0.5)
    ax.axvline(0, color="grey", lw=0.5)
    ax.set_xlabel(f"PC1 ({evr[0] * 100:.1f}%)")
    ax.set_ylabel(f"PC2 ({evr[1] * 100:.1f}%)")
    ax.set_title("Combined biplot — hands (blue) and node loadings (orange)")
    fig.tight_layout()
    fig.savefig(PCA_DIR / "combined_biplot.png", dpi=DPI)
    plt.close(fig)


# --------------------------------------------------------------------------- #
# Clustering helpers                                                           #
# --------------------------------------------------------------------------- #
def pca_for_clustering(
    scaled: np.ndarray,
    row_weights: np.ndarray,
    feature_weights: np.ndarray,
    var_threshold: float = 0.85,
) -> tuple[np.ndarray, int]:
    """Return PCA scores keeping enough components for `var_threshold` variance."""
    pca = WeightedPCA(row_weights=row_weights, feature_weights=feature_weights)
    scores = pca.fit_transform(scaled)
    cum = np.cumsum(pca.explained_variance_ratio_)
    n_components = int(np.searchsorted(cum, var_threshold) + 1)
    n_components = min(n_components, scores.shape[1])
    return scores[:, :n_components], n_components


def kmeans_sweep(
    data: np.ndarray,
    k_range: range,
    sample_weights: np.ndarray | None = None,
) -> tuple[list[float], list[float]]:
    inertias, silhouettes = [], []
    for k in k_range:
        km = KMeans(n_clusters=k, n_init=10, random_state=42)
        labels = km.fit_predict(data, sample_weight=sample_weights)
        inertias.append(km.inertia_)
        if k >= 2 and len(set(labels)) > 1 and len(data) > k:
            silhouettes.append(silhouette_score(data, labels))
        else:
            silhouettes.append(np.nan)
    return inertias, silhouettes


def plot_elbow_silhouette(
    k_range: range,
    inertias: list[float],
    silhouettes: list[float],
    chosen_k: int,
    out_path: Path,
    title_prefix: str,
) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    axes[0].plot(list(k_range), inertias, marker="o", color="steelblue")
    axes[0].axvline(chosen_k, color="red", linestyle="--", linewidth=1)
    axes[0].set_xlabel("k")
    axes[0].set_ylabel("Inertia (within-cluster SSE)")
    axes[0].set_title(f"{title_prefix} — K-Means elbow")
    axes[0].set_xticks(list(k_range))

    axes[1].plot(list(k_range), silhouettes, marker="o", color="darkorange")
    axes[1].axvline(chosen_k, color="red", linestyle="--", linewidth=1)
    axes[1].set_xlabel("k")
    axes[1].set_ylabel("Silhouette score")
    axes[1].set_title(f"{title_prefix} — silhouette scores")
    axes[1].set_xticks(list(k_range))

    fig.tight_layout()
    fig.savefig(out_path, dpi=DPI)
    plt.close(fig)


def plot_dendrogram(data: np.ndarray, labels: list[str], out_path: Path, title: str) -> np.ndarray:
    Z = linkage(data, method="ward")
    fig, ax = plt.subplots(figsize=(max(10, len(labels) * 0.35), 7))
    dendrogram(Z, labels=labels, leaf_rotation=90, leaf_font_size=8, ax=ax)
    ax.set_title(title)
    ax.set_xlabel("Item")
    ax.set_ylabel("Ward distance")
    fig.tight_layout()
    fig.savefig(out_path, dpi=DPI)
    plt.close(fig)
    return Z


def choose_k(silhouettes: list[float], k_range: range) -> int:
    """Pick the k with the highest silhouette score (ties → smallest k)."""
    arr = np.array(silhouettes, dtype=float)
    if np.all(np.isnan(arr)):
        return list(k_range)[0]
    best_idx = int(np.nanargmax(arr))
    return list(k_range)[best_idx]


def plot_clusters_in_pca(
    scores_2d: np.ndarray,
    labels: list[str],
    clusters: np.ndarray,
    evr: np.ndarray,
    out_path: Path,
    title: str,
) -> None:
    fig, ax = plt.subplots(figsize=(11, 9))
    palette = sns.color_palette("tab10", n_colors=int(clusters.max()) + 1)
    for c in sorted(set(clusters)):
        mask = clusters == c
        ax.scatter(
            scores_2d[mask, 0], scores_2d[mask, 1],
            color=palette[c], label=f"Cluster {c}", s=45, alpha=0.8,
        )
    texts = [
        ax.text(scores_2d[i, 0], scores_2d[i, 1], labels[i], fontsize=8)
        for i in range(len(labels))
    ]
    adjust_text_quiet(texts, ax=ax, arrowprops=dict(arrowstyle="-", color="grey", lw=0.4))
    ax.axhline(0, color="grey", lw=0.5)
    ax.axvline(0, color="grey", lw=0.5)
    ax.set_xlabel(f"PC1 ({evr[0] * 100:.1f}%)")
    ax.set_ylabel(f"PC2 ({evr[1] * 100:.1f}%)")
    ax.set_title(title)
    ax.legend(loc="best", frameon=True)
    fig.tight_layout()
    fig.savefig(out_path, dpi=DPI)
    plt.close(fig)


# --------------------------------------------------------------------------- #
# Task 2: cluster hands                                                        #
# --------------------------------------------------------------------------- #
def cluster_hands(
    scaled: np.ndarray,
    hand_labels: list[str],
    hand_weights: np.ndarray,
    node_weights: np.ndarray,
    pca_full: WeightedPCA,
) -> None:
    CLUSTER_DIR.mkdir(parents=True, exist_ok=True)
    reduced, n_comp = pca_for_clustering(scaled, hand_weights, node_weights, 0.85)
    print(f"\n=== Hand clustering ===")
    print(f"Using {n_comp} weighted PCA components for hand clustering (>=85% variance).")

    n_samples = reduced.shape[0]
    k_max = min(10, max(2, n_samples - 1))
    k_range = range(2, k_max + 1)
    inertias, silhouettes = kmeans_sweep(reduced, k_range, sample_weights=hand_weights)
    best_silhouette_k = choose_k(silhouettes, k_range)
    chosen_k = HANDS_K
    print(f"Best-silhouette k for hands: {best_silhouette_k}")
    print(f"Using fixed k for hands: {chosen_k}")

    plot_elbow_silhouette(
        k_range, inertias, silhouettes, chosen_k,
        CLUSTER_DIR / "hands_elbow_silhouette.png",
        title_prefix="Hands",
    )
    plot_dendrogram(
        reduced, hand_labels,
        CLUSTER_DIR / "hands_dendrogram.png",
        "Hands hierarchical clustering (Ward)",
    )

    km = KMeans(n_clusters=chosen_k, n_init=10, random_state=42)
    clusters = km.fit_predict(reduced, sample_weight=hand_weights)

    scores_2d = pca_full.transform(scaled)[:, :2]
    plot_clusters_in_pca(
        scores_2d, hand_labels, clusters, pca_full.explained_variance_ratio_,
        CLUSTER_DIR / "hands_clusters_pca.png",
        f"Hand clusters (k={chosen_k}) in PCA space",
    )

    out = pd.DataFrame({"hand": hand_labels, "cluster": clusters})
    out.to_csv(CLUSTER_DIR / "hand_clusters.csv", index=False)
    print(f"Wrote {CLUSTER_DIR / 'hand_clusters.csv'}")


# --------------------------------------------------------------------------- #
# Task 3: cluster nodes                                                        #
# --------------------------------------------------------------------------- #
def cluster_nodes(
    scaled: np.ndarray,
    node_cols: list[str],
    hand_weights: np.ndarray,
    node_weights: np.ndarray,
) -> None:
    CLUSTER_DIR.mkdir(parents=True, exist_ok=True)

    # Transpose: rows = nodes, columns = hands
    nodes_matrix = scaled.T  # shape: (n_nodes, n_hands)

    pca_nodes = WeightedPCA(row_weights=node_weights, feature_weights=hand_weights)
    node_scores_full = pca_nodes.fit_transform(nodes_matrix)
    cum = np.cumsum(pca_nodes.explained_variance_ratio_)
    n_comp = int(np.searchsorted(cum, 0.85) + 1)
    n_comp = min(n_comp, node_scores_full.shape[1])
    reduced = node_scores_full[:, :n_comp]
    print(f"\n=== Node clustering ===")
    print(f"Using {n_comp} weighted PCA components for node clustering (>=85% variance).")

    n_samples = reduced.shape[0]
    k_max = min(10, max(2, n_samples - 1))
    k_range = range(2, k_max + 1)
    inertias, silhouettes = kmeans_sweep(reduced, k_range, sample_weights=node_weights)
    chosen_k = choose_k(silhouettes, k_range)
    print(f"Chosen k for nodes: {chosen_k}")

    plot_elbow_silhouette(
        k_range, inertias, silhouettes, chosen_k,
        CLUSTER_DIR / "nodes_elbow_silhouette.png",
        title_prefix="Nodes",
    )
    plot_dendrogram(
        reduced, node_cols,
        CLUSTER_DIR / "nodes_dendrogram.png",
        "Nodes hierarchical clustering (Ward)",
    )

    km = KMeans(n_clusters=chosen_k, n_init=10, random_state=42)
    clusters = km.fit_predict(reduced, sample_weight=node_weights)

    plot_clusters_in_pca(
        node_scores_full[:, :2], node_cols, clusters,
        pca_nodes.explained_variance_ratio_,
        CLUSTER_DIR / "nodes_clusters_pca.png",
        f"Node clusters (k={chosen_k}) in PCA space",
    )

    out = pd.DataFrame({"node": node_cols, "cluster": clusters})
    out.to_csv(CLUSTER_DIR / "node_clusters.csv", index=False)
    print(f"Wrote {CLUSTER_DIR / 'node_clusters.csv'}")


# --------------------------------------------------------------------------- #
# Entry point                                                                  #
# --------------------------------------------------------------------------- #
def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", type=Path, default=DEFAULT_INPUT,
        help=f"CSV file with hand + x.. columns (default: {DEFAULT_INPUT})",
    )
    parser.add_argument(
        "--hand-combos", type=Path, default=DEFAULT_HAND_COMBOS,
        help=f"CSV file with hand combo counts (default: {DEFAULT_HAND_COMBOS})",
    )
    parser.add_argument(
        "--node-probabilities", type=Path, default=DEFAULT_NODE_PROBS,
        help=f"CSV file with node reach probabilities (default: {DEFAULT_NODE_PROBS})",
    )
    args = parser.parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input CSV not found: {args.input}")
    if not args.hand_combos.exists():
        raise FileNotFoundError(f"Hand combo CSV not found: {args.hand_combos}")
    if not args.node_probabilities.exists():
        raise FileNotFoundError(f"Node probabilities CSV not found: {args.node_probabilities}")

    sns.set_style("whitegrid")

    df, node_cols, scaled, hand_weights, node_weights = load_data(
        args.input,
        args.hand_combos,
        args.node_probabilities,
    )
    hand_labels = df["hand"].tolist()
    print(f"Loaded {len(hand_labels)} hands x {len(node_cols)} nodes from {args.input}")
    print(f"Loaded hand weights from {args.hand_combos}")
    print(f"Loaded node weights from {args.node_probabilities}")

    pca_full = run_pca(scaled, hand_labels, node_cols, hand_weights, node_weights)
    cluster_hands(scaled, hand_labels, hand_weights, node_weights, pca_full)
    cluster_nodes(scaled, node_cols, hand_weights, node_weights)

    print("\nDone.")
    print(f"PCA outputs:        {PCA_DIR}")
    print(f"Clustering outputs: {CLUSTER_DIR}")


if __name__ == "__main__":
    main()
