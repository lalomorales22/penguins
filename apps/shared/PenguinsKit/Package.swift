// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "PenguinsKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "PenguinsProtocol", targets: ["PenguinsProtocol"]),
        .library(name: "PenguinsKit", targets: ["PenguinsKit"]),
        .library(name: "PenguinsChatUI", targets: ["PenguinsChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "PenguinsProtocol",
            path: "Sources/PenguinsProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "PenguinsKit",
            dependencies: [
                "PenguinsProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/PenguinsKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "PenguinsChatUI",
            dependencies: [
                "PenguinsKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/PenguinsChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "PenguinsKitTests",
            dependencies: ["PenguinsKit", "PenguinsChatUI"],
            path: "Tests/PenguinsKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
