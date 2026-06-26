'use client'

import type { CSSProperties } from 'react'
import type { AnswerImage } from './answerImage'

function inlineImageStyle(image: AnswerImage): CSSProperties {
  return {
    float: image.float,
    width: image.width,
    height: image.height,
    margin: 0,
    marginTop: image.offsetY,
    marginBottom: 12,
    ...(image.float === 'left' ? { marginRight: 12 } : { marginLeft: 12 }),
  }
}

export function AnswerInlineImagePreview({ image }: { image: AnswerImage }) {
  return (
    <div className="inline-block" style={inlineImageStyle(image)}>
      <img
        src={image.src}
        alt=""
        className="w-full h-full object-cover rounded"
        draggable={false}
      />
    </div>
  )
}

type AnswerInlineImageProps = {
  id: number | string
  image: AnswerImage
  onDragStart: (e: React.MouseEvent) => void
  onResizeStart: (corner: string, e: React.MouseEvent) => void
  onReplace: () => void
  onRemove: () => void
}

export default function AnswerInlineImage({
  id,
  image,
  onDragStart,
  onResizeStart,
  onReplace,
  onRemove,
}: AnswerInlineImageProps) {
  return (
    <div
      className="relative inline-block nodrag group/img"
      style={inlineImageStyle(image)}
    >
      <img
        src={image.src}
        alt=""
        className="w-full h-full object-cover rounded cursor-move"
        draggable={false}
        onMouseDown={onDragStart}
      />
      <div
        onMouseDown={(e) => onResizeStart('nw', e)}
        className="absolute"
        style={{ cursor: 'nwse-resize', top: 0, left: 0 }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect y="6" width="6" height="13.008" rx="2" transform="rotate(-90 0 6)" fill="#FC6839" />
          <rect width="6" height="13.008" rx="2" fill="#FC6839" />
        </svg>
      </div>
      <div
        onMouseDown={(e) => onResizeStart('ne', e)}
        className="absolute"
        style={{ cursor: 'nesw-resize', top: 0, right: 0 }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="7.008" width="6" height="13.008" rx="2" fill="#FC6839" />
          <rect x="13.008" width="6" height="13.008" rx="2" transform="rotate(90 13.008 0)" fill="#FC6839" />
        </svg>
      </div>
      <div
        onMouseDown={(e) => onResizeStart('sw', e)}
        className="absolute"
        style={{ cursor: 'nesw-resize', bottom: 0, left: 0 }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="6" y="13.008" width="6" height="13.008" rx="2" transform="rotate(180 6 13.008)" fill="#FC6839" />
          <rect y="13.008" width="6" height="13.008" rx="2" transform="rotate(-90 0 13.008)" fill="#FC6839" />
        </svg>
      </div>
      <div
        onMouseDown={(e) => onResizeStart('se', e)}
        className="absolute"
        style={{ cursor: 'nwse-resize', bottom: 0, right: 0 }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="13.008" y="7.008" width="6" height="13.008" rx="2" transform="rotate(90 13.008 7.008)" fill="#FC6839" />
          <rect x="13.008" y="13.008" width="6" height="13.008" rx="2" transform="rotate(180 13.008 13.008)" fill="#FC6839" />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/30 absolute inset-0 rounded pointer-events-none" />
        <div className="relative z-10 flex items-center bg-white rounded-full border border-[#D6D1CB] px-2 py-2 gap-1 shadow-lg pointer-events-auto">
          <div className="relative group/replace">
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer"
              onClick={onReplace}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id={`mask_replace_${id}`} style={{ maskType: 'alpha' as const }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                  <rect width="20" height="20" fill="#D9D9D9" />
                </mask>
                <g mask={`url(#mask_replace_${id})`}>
                  <path d="M10.0417 16.6667C8.18056 16.6667 6.59722 16.0209 5.29167 14.7292C3.98611 13.4375 3.33333 11.8612 3.33333 10V9.85421L2.58333 10.6042C2.43056 10.757 2.23611 10.8334 2 10.8334C1.76389 10.8334 1.56944 10.757 1.41667 10.6042C1.26389 10.4514 1.1875 10.257 1.1875 10.0209C1.1875 9.78476 1.26389 9.59032 1.41667 9.43754L3.58333 7.27087C3.66667 7.18754 3.75694 7.12837 3.85417 7.09337C3.95139 7.05893 4.05556 7.04171 4.16667 7.04171C4.27778 7.04171 4.38194 7.05893 4.47917 7.09337C4.57639 7.12837 4.66667 7.18754 4.75 7.27087L6.91667 9.43754C7.06944 9.59032 7.14583 9.78476 7.14583 10.0209C7.14583 10.257 7.06944 10.4514 6.91667 10.6042C6.76389 10.757 6.56944 10.8334 6.33333 10.8334C6.09722 10.8334 5.90278 10.757 5.75 10.6042L5 9.85421V10C5 11.3889 5.48972 12.5695 6.46917 13.5417C7.44806 14.5139 8.63889 15 10.0417 15C10.3194 15 10.5903 14.9759 10.8542 14.9275C11.1181 14.8787 11.3819 14.8056 11.6458 14.7084C11.7847 14.6528 11.9342 14.6389 12.0942 14.6667C12.2536 14.6945 12.3889 14.7639 12.5 14.875C12.75 15.125 12.8508 15.3923 12.8025 15.6767C12.7536 15.9617 12.5694 16.1598 12.25 16.2709C11.8889 16.3959 11.5244 16.4931 11.1567 16.5625C10.7883 16.632 10.4167 16.6667 10.0417 16.6667ZM15.8333 12.9584C15.7222 12.9584 15.6181 12.9409 15.5208 12.9059C15.4236 12.8714 15.3333 12.8125 15.25 12.7292L13.0833 10.5625C12.9306 10.4098 12.8542 10.2153 12.8542 9.97921C12.8542 9.7431 12.9306 9.54865 13.0833 9.39587C13.2361 9.2431 13.4306 9.16671 13.6667 9.16671C13.9028 9.16671 14.0972 9.2431 14.25 9.39587L15 10.1459V10C15 8.61115 14.5106 7.4306 13.5317 6.45837C12.5522 5.48615 11.3611 5.00004 9.95833 5.00004C9.68056 5.00004 9.40972 5.02448 9.14583 5.07337C8.88194 5.12171 8.61806 5.19449 8.35417 5.29171C8.21528 5.34726 8.06611 5.36115 7.90667 5.33337C7.74667 5.3056 7.61111 5.23615 7.5 5.12504C7.25 4.87504 7.14917 4.60754 7.1975 4.32254C7.24639 4.0381 7.43056 3.84032 7.75 3.72921C8.11111 3.60421 8.47583 3.50699 8.84417 3.43754C9.21194 3.3681 9.58333 3.33337 9.95833 3.33337C11.8194 3.33337 13.4028 3.97921 14.7083 5.27087C16.0139 6.56254 16.6667 8.13893 16.6667 10V10.1459L17.4167 9.39587C17.5694 9.2431 17.7639 9.16671 18 9.16671C18.2361 9.16671 18.4306 9.2431 18.5833 9.39587C18.7361 9.54865 18.8125 9.7431 18.8125 9.97921C18.8125 10.2153 18.7361 10.4098 18.5833 10.5625L16.4167 12.7292C16.3333 12.8125 16.2431 12.8714 16.1458 12.9059C16.0486 12.9409 15.9444 12.9584 15.8333 12.9584Z" fill="#172537" />
                </g>
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/replace:opacity-100 transition-opacity">
              Replace
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          </div>
          <div className="relative group/remove">
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#73716F26] transition-colors cursor-pointer"
              onClick={onRemove}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 10.05L5.325 13.725a.706.706 0 0 1-.525.206.706.706 0 0 1-.525-.206.706.706 0 0 1-.206-.525c0-.213.069-.388.206-.525L7.95 9 4.275 5.325a.706.706 0 0 1-.206-.525c0-.213.069-.388.206-.525a.706.706 0 0 1 .525-.206c.213 0 .388.069.525.206L9 7.95l3.675-3.675a.706.706 0 0 1 .525-.206c.213 0 .388.069.525.206a.706.706 0 0 1 .206.525.706.706 0 0 1-.206.525L10.05 9l3.675 3.675a.706.706 0 0 1 .206.525.706.706 0 0 1-.206.525.706.706 0 0 1-.525.206.706.706 0 0 1-.525-.206L9 10.05Z" fill="#293748" />
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/remove:opacity-100 transition-opacity">
              Remove
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
