import * as React from "react"

const FALLBACK_IMAGE_URL = "https://placehold.co/600x400?text=M'baara"

const Image = React.forwardRef(({ src, alt = "", ...props }, ref) => {
  const imageSrc = src || FALLBACK_IMAGE_URL

  return <img ref={ref} src={imageSrc} alt={alt} {...props} />
})

Image.displayName = "Image"

export { Image }
