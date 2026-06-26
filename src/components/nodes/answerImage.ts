export type AnswerImage = {
  src: string
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
  float: 'left' | 'right' | 'none'
  offsetX: number
  offsetY: number
}

export function normalizeAnswerImage(
  image?: Partial<AnswerImage> & Pick<AnswerImage, 'src' | 'width' | 'height'>,
): AnswerImage | undefined {
  if (!image?.src) return undefined
  return {
    src: image.src,
    width: image.width,
    height: image.height,
    naturalWidth: image.naturalWidth ?? image.width,
    naturalHeight: image.naturalHeight ?? image.height,
    float: image.float ?? 'left',
    offsetX: image.offsetX ?? 0,
    offsetY: image.offsetY ?? 0,
  }
}

export function createAnswerImageFromFile(
  dataUrl: string,
  naturalWidth: number,
  naturalHeight: number,
  maxWidth = 200,
): AnswerImage {
  const scale = naturalWidth > maxWidth ? maxWidth / naturalWidth : 1
  return {
    src: dataUrl,
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
    naturalWidth,
    naturalHeight,
    float: 'left',
    offsetX: 0,
    offsetY: 0,
  }
}
