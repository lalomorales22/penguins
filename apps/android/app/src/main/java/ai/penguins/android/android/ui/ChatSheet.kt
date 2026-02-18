package ai.penguins.android.ui

import androidx.compose.runtime.Composable
import ai.penguins.android.MainViewModel
import ai.penguins.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
