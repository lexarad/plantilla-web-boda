import * as QRCode from "qrcode";

export async function buildQrSvg(value: string, size = 320) {
  return QRCode.toString(value, {
    type: "svg",
    width: size,
    margin: 1,
    errorCorrectionLevel: "M"
  });
}
