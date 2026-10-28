package app.irdl.companion

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Locale

/** The console's own look: deep ink panels, the ice accent for focus and progress. */
object Ink {
    val canvas = Color(0xFF05070D)
    val deep = Color(0xFF090D16)
    val panel = Color(0xFF0F1520)
    val panel2 = Color(0xFF1D2738)
    val line = Color(0xFF243047)
    val fg = Color(0xFFF3F6FB)
    val muted = Color(0xFFA6B1C4)
    val subtle = Color(0xFF75839A)
    val accent = Color(0xFF3A86FF)
    val ice = Color(0xFF4CC9F0)
    val good = Color(0xFF4ADE80)
    val warn = Color(0xFFFBBF24)
    val bad = Color(0xFFF87171)
}

val Corner = RoundedCornerShape(4.dp)

@Composable
fun IrdlTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Ink.ice, onPrimary = Ink.canvas, secondary = Ink.accent,
            background = Ink.canvas, onBackground = Ink.fg, surface = Ink.panel, onSurface = Ink.fg,
            surfaceVariant = Ink.panel2, onSurfaceVariant = Ink.muted, outline = Ink.line, error = Ink.bad
        ),
        content = content
    )
}

@Composable
fun Panel(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier.fillMaxWidth().background(Ink.panel, Corner).border(1.dp, Ink.line, Corner).padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp), content = content
    )
}

@Composable
fun Label(text: String, trailing: String = "") {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(Modifier.size(width = 4.dp, height = 16.dp).background(Ink.ice))
        Text(text.uppercase(Locale.ROOT), color = Ink.fg, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
        if (trailing.isNotEmpty()) Text(trailing, color = Ink.subtle, fontSize = 12.sp)
    }
}

@Composable
fun Primary(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, onClick: () -> Unit) {
    Button(
        onClick, modifier, enabled = enabled, shape = Corner,
        colors = ButtonDefaults.buttonColors(containerColor = Ink.ice, contentColor = Ink.canvas, disabledContainerColor = Ink.panel2, disabledContentColor = Ink.subtle)
    ) { Text(text, fontWeight = FontWeight.Bold) }
}

@Composable
fun Ghost(text: String, modifier: Modifier = Modifier, danger: Boolean = false, enabled: Boolean = true, onClick: () -> Unit) {
    val color = if (danger) Ink.bad else Ink.fg
    OutlinedButton(
        onClick, modifier, enabled = enabled, shape = Corner,
        border = BorderStroke(1.dp, if (danger) Ink.bad.copy(alpha = 0.6f) else Ink.line),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = color, disabledContentColor = Ink.subtle)
    ) { Text(text, fontWeight = FontWeight.SemiBold) }
}

@Composable
fun Field(value: String, onChange: (String) -> Unit, hint: String, modifier: Modifier = Modifier, keyboard: androidx.compose.foundation.text.KeyboardOptions = androidx.compose.foundation.text.KeyboardOptions.Default, secret: Boolean = false, single: Boolean = true) {
    OutlinedTextField(
        value = value, onValueChange = onChange, modifier = modifier.fillMaxWidth(), singleLine = single, shape = Corner,
        placeholder = { Text(hint, color = Ink.subtle) }, keyboardOptions = keyboard,
        visualTransformation = if (secret) androidx.compose.ui.text.input.PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Ink.ice, unfocusedBorderColor = Ink.line, cursorColor = Ink.ice,
            focusedContainerColor = Ink.deep, unfocusedContainerColor = Ink.deep,
            focusedTextColor = Ink.fg, unfocusedTextColor = Ink.fg
        )
    )
}

@Composable
fun Bar(fraction: Float?, modifier: Modifier = Modifier, color: Color = Ink.ice) {
    if (fraction == null) {
        LinearProgressIndicator(modifier.fillMaxWidth().height(5.dp), color = color, trackColor = Ink.panel2)
    } else {
        LinearProgressIndicator(progress = { fraction.coerceIn(0f, 1f) }, modifier = modifier.fillMaxWidth().height(5.dp), color = color, trackColor = Ink.panel2)
    }
}

@Composable
fun Note(text: String, color: Color = Ink.muted, modifier: Modifier = Modifier) {
    Text(text, color = color, fontSize = 13.sp, lineHeight = 18.sp, modifier = modifier)
}

@Composable
fun Spacer(height: Int) {
    Box(Modifier.height(height.dp))
}

fun sizeText(bytes: Long): String = when {
    bytes < 0 -> "?"
    bytes >= 1L shl 30 -> String.format(Locale.US, "%.1f GB", bytes / 1073741824.0)
    bytes >= 1L shl 20 -> String.format(Locale.US, "%.0f MB", bytes / 1048576.0)
    else -> String.format(Locale.US, "%d KB", bytes / 1024)
}

fun prettyState(state: String): String = state.replace('-', ' ').replaceFirstChar { it.uppercase() }
