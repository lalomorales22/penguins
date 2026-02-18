// swift-tools-version: 6.2
// Package manifest for the Penguins macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "Penguins",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "PenguinsIPC", targets: ["PenguinsIPC"]),
        .library(name: "PenguinsDiscovery", targets: ["PenguinsDiscovery"]),
        .executable(name: "Penguins", targets: ["Penguins"]),
        .executable(name: "penguins-mac", targets: ["PenguinsMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/PenguinsKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "PenguinsIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "PenguinsDiscovery",
            dependencies: [
                .product(name: "PenguinsKit", package: "PenguinsKit"),
            ],
            path: "Sources/PenguinsDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "Penguins",
            dependencies: [
                "PenguinsIPC",
                "PenguinsDiscovery",
                .product(name: "PenguinsKit", package: "PenguinsKit"),
                .product(name: "PenguinsChatUI", package: "PenguinsKit"),
                .product(name: "PenguinsProtocol", package: "PenguinsKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/Penguins.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "PenguinsMacCLI",
            dependencies: [
                "PenguinsDiscovery",
                .product(name: "PenguinsKit", package: "PenguinsKit"),
                .product(name: "PenguinsProtocol", package: "PenguinsKit"),
            ],
            path: "Sources/PenguinsMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "PenguinsIPCTests",
            dependencies: [
                "PenguinsIPC",
                "Penguins",
                "PenguinsDiscovery",
                .product(name: "PenguinsProtocol", package: "PenguinsKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
