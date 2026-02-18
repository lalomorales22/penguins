package ai.penguins.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class PenguinsProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", PenguinsCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", PenguinsCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", PenguinsCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", PenguinsCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", PenguinsCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", PenguinsCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", PenguinsCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", PenguinsCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", PenguinsCapability.Canvas.rawValue)
    assertEquals("camera", PenguinsCapability.Camera.rawValue)
    assertEquals("screen", PenguinsCapability.Screen.rawValue)
    assertEquals("voiceWake", PenguinsCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", PenguinsScreenCommand.Record.rawValue)
  }
}
