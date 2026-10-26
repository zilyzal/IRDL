// Copyright (C) 2026 half144 and PS5 React contributors
// SPDX-License-Identifier: GPL-3.0-or-later
// Additional attribution term: see LICENSE-ATTRIBUTION.
#pragma once
#include <chrono>
#include <cstdint>
#include <string>
#include <vector>
namespace archives {
// Reads the archive headers before libarchive does and returns why the archive must be refused, or an
// empty string when its declared decoder windows fit the console's memory budget.
// The dictionary the RAR worker takes while downloads run (they share the heap) and when nothing downloads.
constexpr std::uint64_t rar_window_busy = 32ULL * 1024 * 1024, rar_window_idle = 128ULL * 1024 * 1024;
// rar_worker_window: when set, a RAR5 set the RAR worker extracts is held to that dictionary, not libarchive's
// doubled one; rar_after_window is the larger limit once downloads stop, named in the refusal.
std::string preflight(const std::vector<std::string>& sources, std::uint64_t rar_worker_window = 0, std::uint64_t rar_after_window = 0);
// `title`: the title id a PKG's content id names (its header's "UP0001-CUSA01234_00-..." at 0x40),
// so the app can tell another game's file from the one chosen before it has all downloaded.
struct Inspection { std::string kind, refusal, title{}; };
// What the leading bytes of the ordered volumes are ("rar", "7z", "zip", "tar", "tar.gz", "tar.bz2",
// "tar.xz", "tar.zst", "pkg", "exfat", "ffpkg", "ffpfs", "ffpfsc" or empty), and for an archive, a
// refusal its headers read so far already justify. Works on a partial download, holes included.
// For a RAR, the walk reads at least the first file header, then stops once a header starts past
// `inspect_budget` (100 ms; tests change it).
Inspection inspect(const std::vector<std::string>& sources, std::uint64_t rar_worker_window = rar_window_idle, std::uint64_t rar_after_window = 0);
extern std::chrono::milliseconds inspect_budget;
}
