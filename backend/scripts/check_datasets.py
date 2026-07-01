from pathlib import Path


DATASETS = [
    ("SynthText", "synthtext"),
    ("VinText", "vintext"),
    ("Chars74K", "chars74k"),
    ("TextOCR", "textocr"),
    ("NOD", "nod_subset"),
    ("Synthetic Vietnamese", "synthetic_vietnamese"),
]


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    datasets_root = repo_root / "datasets"

    print("Dataset check only. No download will be started.")
    print(f"Datasets root: {datasets_root}")
    for name, folder in DATASETS:
        path = datasets_root / folder
        status = "found" if path.is_dir() else "not_downloaded"
        print(f"{name}: {status} ({path})")


if __name__ == "__main__":
    main()
