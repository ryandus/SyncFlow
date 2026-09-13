/**
 * SyncFlow: Forensic Visual Watermark Generator
 * Embeds "SyncFlow | Engineered by R. Hanks" directly on canvas and evidence cards
 * Engineered by R. Hanks
 */

export function applyCanvasWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: 'corner' | 'diagonal' | 'both' = 'both'
): void {
  ctx.save();

  if (mode === 'diagonal' || mode === 'both') {
    // Subtle repeating diagonal watermark pattern
    ctx.rotate(-Math.PI / 8);
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    const text = 'SyncFlow | Engineered by R. Hanks • ';
    
    // Repeat across the canvas
    const stepX = 320;
    const stepY = 120;
    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.fillText(text, x, y);
      }
    }
    // Restore rotation
    ctx.restore();
    ctx.save();
  }

  if (mode === 'corner' || mode === 'both') {
    // High-contrast but non-intrusive corner watermark badge
    const badgeText = 'SyncFlow | Engineered by R. Hanks';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    const metrics = ctx.measureText(badgeText);
    const paddingX = 10;
    const paddingY = 6;
    const badgeWidth = metrics.width + paddingX * 2;
    const badgeHeight = 22;
    const posX = width - badgeWidth - 16;
    const posY = height - badgeHeight - 16;

    // Dark semi-transparent pill backing
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.beginPath();
    ctx.roundRect(posX, posY, badgeWidth, badgeHeight, 4);
    ctx.fill();

    // Subtle cyan/teal border
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Watermark text
    ctx.fillStyle = '#2dd4bf'; // teal-400
    ctx.fillText('SyncFlow', posX + paddingX, posY + 15);

    const syncMetrics = ctx.measureText('SyncFlow');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(' | Engineered by R. Hanks', posX + paddingX + syncMetrics.width, posY + 15);
  }

  ctx.restore();
}
