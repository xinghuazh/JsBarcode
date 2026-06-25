import merge from "../help/merge.js";
import { calculateEncodingAttributes, getTotalWidthOfEncodings, getMaximumHeightOfEncodings } from "./shared.js";

class CanvasRenderer {
  constructor(canvas, encodings, options) {
    this.canvas = canvas;
    this.encodings = encodings;
    this.options = options;
  }

  render() {
    // Abort if the browser does not support HTML5 canvas
    if (!this.canvas.getContext) {
      throw new Error('The browser does not support canvas.');
    }

    this.prepareCanvas();
    for (let i = 0; i < this.encodings.length; i++) {
      var encodingOptions = merge(this.options, this.encodings[i].options);

      this.drawCanvasBarcode(encodingOptions, this.encodings[i]);
      this.drawCanvasText(encodingOptions, this.encodings[i]);

      this.moveCanvasDrawing(this.encodings[i]);
    }

    this.restoreCanvas();
  }

  prepareCanvas() {
    // Get the canvas context
    var ctx = this.canvas.getContext("2d");

    ctx.save();

    calculateEncodingAttributes(this.encodings, this.options, ctx);
    var totalWidth = getTotalWidthOfEncodings(this.encodings);
    var maxHeight = getMaximumHeightOfEncodings(this.encodings);

    this.canvas.width = totalWidth + this.options.marginLeft + this.options.marginRight;

    this.canvas.height = maxHeight;

    // Paint the canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.options.background) {
      ctx.fillStyle = this.options.background;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    ctx.translate(this.options.marginLeft, 0);
  }

  drawCanvasBarcode(options, encoding) {
    // Get the canvas context
    var ctx = this.canvas.getContext("2d");

    var binary = encoding.data;

    // Creates the barcode out of the encoded binary
    var yFrom;
    if (options.textPosition == "top") {
      yFrom = options.marginTop + options.fontSize + options.textMargin;
    }
    else {
      yFrom = options.marginTop;
    }

    ctx.fillStyle = options.lineColor;

    for (var b = 0; b < binary.length; b++) {
      var x = b * options.width + encoding.barcodePadding;

      if (binary[b] === "1") {
        ctx.fillRect(x, yFrom, options.width, options.height);
      }
      else if (binary[b]) {
        ctx.fillRect(x, yFrom, options.width, options.height * binary[b]);
      }
    }
  }

  drawCanvasText(options, encoding) {
    // Get the canvas context
    var ctx = this.canvas.getContext("2d");

    var font = options.fontOptions + " " + options.fontSize + "px " + options.font;

    // Draw the text if displayValue is set
    do {
      if (!options.displayValue) break;

      var x, y;

      if (options.textPosition == "top") {
        y = options.marginTop + options.fontSize - options.textMargin;
      } else {
        y = options.height + options.textMargin + options.marginTop + options.fontSize;
      }

      ctx.font = font;
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';

      var text = encoding.text;
      switch (options.format) {
        case 'CODE128ESC1':
          options.textAlign = "justify";
          if (text.length == 20) {
            text = text.substr(0, 5) + ' ' +
              text.substr(5, 5) + ' ' +
              text.substr(10, 5) + ' ' +
              text.substr(15, 5);
          }
          break;

        default:
          break;
      }

      // 两端对齐模式
      if (options.textAlign == "justify") {
        var textWidth = ctx.measureText(text).width;
        var barcodeWidth = encoding.width;

        // 如果文本为空或只有一个字符，直接绘制
        if (text.length <= 1) {
          ctx.fillText(text, 0, y);
          break;
        }

        // 如果文本宽度大于条码宽度，缩小字体或截断
        if (textWidth > barcodeWidth) {
          // 尝试缩小字体
          var scaleFactor = barcodeWidth / textWidth * 0.95;
          var newFontSize = Math.floor(options.fontSize * scaleFactor);
          ctx.font = options.fontOptions + " " + newFontSize + "px " + options.font;
          textWidth = ctx.measureText(text).width;

          if (textWidth > barcodeWidth) {
            // 如果缩小后仍然超出，使用左对齐并截断提示
            console.warn('text too long');
            ctx.fillText(text, 0, y);
            break;
          }
        }

        // 计算总间距
        var totalSpacing = barcodeWidth - textWidth;
        var spacingPerChar = totalSpacing / (text.length - 1);

        // 逐个绘制字符
        var currentX = 0;
        for (var i = 0; i < text.length; i++) {
          var char = text[i];
          ctx.fillText(char, currentX, y);
          if (i < text.length - 1) {
            currentX += ctx.measureText(char).width + spacingPerChar;
          }
        }
        break;
      }

      // 标准对齐模式
      if (options.textAlign == "left" || encoding.barcodePadding > 0) {
        x = 0;
        ctx.textAlign = 'left';
      } else if (options.textAlign == "right") {
        x = encoding.width - 1;
        ctx.textAlign = 'right';
      } else {
        x = encoding.width / 2;
        ctx.textAlign = 'center';
      }

      ctx.fillText(text, x, y);
    } while (0);
  }

  moveCanvasDrawing(encoding) {
    var ctx = this.canvas.getContext("2d");

    ctx.translate(encoding.width, 0);
  }

  restoreCanvas() {
    // Get the canvas context
    var ctx = this.canvas.getContext("2d");

    ctx.restore();
  }
}

export default CanvasRenderer;
