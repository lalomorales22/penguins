import Foundation
import Testing
@testable import Penguins

@Suite(.serialized)
struct PenguinsConfigFileTests {
    @Test
    func configPathRespectsEnvOverride() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("penguins-config-\(UUID().uuidString)")
            .appendingPathComponent("penguins.json")
            .path

        await TestIsolation.withEnvValues(["OPENCLAW_CONFIG_PATH": override]) {
            #expect(PenguinsConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func remoteGatewayPortParsesAndMatchesHost() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("penguins-config-\(UUID().uuidString)")
            .appendingPathComponent("penguins.json")
            .path

        await TestIsolation.withEnvValues(["OPENCLAW_CONFIG_PATH": override]) {
            PenguinsConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(PenguinsConfigFile.remoteGatewayPort() == 19999)
            #expect(PenguinsConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(PenguinsConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(PenguinsConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func setRemoteGatewayUrlPreservesScheme() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("penguins-config-\(UUID().uuidString)")
            .appendingPathComponent("penguins.json")
            .path

        await TestIsolation.withEnvValues(["OPENCLAW_CONFIG_PATH": override]) {
            PenguinsConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            PenguinsConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = PenguinsConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @Test
    func stateDirOverrideSetsConfigPath() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("penguins-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "OPENCLAW_CONFIG_PATH": nil,
            "OPENCLAW_STATE_DIR": dir,
        ]) {
            #expect(PenguinsConfigFile.stateDirURL().path == dir)
            #expect(PenguinsConfigFile.url().path == "\(dir)/penguins.json")
        }
    }

    @MainActor
    @Test
    func saveDictAppendsConfigAuditLog() async throws {
        let stateDir = FileManager().temporaryDirectory
            .appendingPathComponent("penguins-state-\(UUID().uuidString)", isDirectory: true)
        let configPath = stateDir.appendingPathComponent("penguins.json")
        let auditPath = stateDir.appendingPathComponent("logs/config-audit.jsonl")

        defer { try? FileManager().removeItem(at: stateDir) }

        try await TestIsolation.withEnvValues([
            "OPENCLAW_STATE_DIR": stateDir.path,
            "OPENCLAW_CONFIG_PATH": configPath.path,
        ]) {
            PenguinsConfigFile.saveDict([
                "gateway": ["mode": "local"],
            ])

            let configData = try Data(contentsOf: configPath)
            let configRoot = try JSONSerialization.jsonObject(with: configData) as? [String: Any]
            #expect((configRoot?["meta"] as? [String: Any]) != nil)

            let rawAudit = try String(contentsOf: auditPath, encoding: .utf8)
            let lines = rawAudit
                .split(whereSeparator: \.isNewline)
                .map(String.init)
            #expect(!lines.isEmpty)
            guard let last = lines.last else {
                Issue.record("Missing config audit line")
                return
            }
            let auditRoot = try JSONSerialization.jsonObject(with: Data(last.utf8)) as? [String: Any]
            #expect(auditRoot?["source"] as? String == "macos-penguins-config-file")
            #expect(auditRoot?["event"] as? String == "config.write")
            #expect(auditRoot?["result"] as? String == "success")
            #expect(auditRoot?["configPath"] as? String == configPath.path)
        }
    }
}
