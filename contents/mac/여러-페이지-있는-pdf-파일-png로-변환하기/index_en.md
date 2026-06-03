---
title: "Converting a Multi-Page PDF File to PNG"
description: "How to convert a multi-page PDF into separate PNG image files from the terminal using the convert command."
date: 2012-02-13
update: 2012-02-13
tags:
  - 맥
  - 명령어
  - 이미지
  - mac
  - pages
  - pdf
  - jpg
  - png
  - cmd
  - 변환
  - image
  - multiple
  - convert
---


There are times when you need to convert a multi-page PDF into image files, and since I can never remember how, I'm leaving it on the blog as a record.

```bash
$ convert -density 150 -trim test.pdf 'test_%d'.png
$ ls 
test.pdf   test_0.png test_1.png test_2.png test_3.png test_4.png
```

I used the `convert` command to convert a multi-page PDF into png files. You can look up the `convert` options in the man page.

```bash
$ man convert
convert(1)                  General Commands Manual                 convert(1)

NAME
       convert - convert between image formats as well as resize an image,
       blur, crop, despeckle, dither, draw on, flip, join, re-sample, and much
       more.

SYNOPSIS
       convert [input-options] input-file [output-options] output-file

OVERVIEW
       The convert program is a member of the ImageMagick(1) suite of tools.
       Use it to convert between image formats as well as resize an image,
       blur, crop, despeckle, dither, draw on, flip, join, re-sample, and much
       more.

       For more information about the convert command, point your browser to
       file:///opt/homebrew/Cellar/imagemagick/7.1.0-57/share/doc/ImageMagick-7/www/convert.html
       or http://imagemagick.org/script/convert.php.

DESCRIPTION
       Image Settings:
         -adjoin              join images into a single multi-image file
         -affine matrix       affine transform matrix
         -alpha option        activate, deactivate, reset, or set the alpha
       channel
         -antialias           remove pixel-aliasing
         -authenticate value  decrypt image with this password
         -attenuate value     lessen (or intensify) when adding noise to an
       image
         -background color    background color
         -bias value          add bias when convolving an image
         -black-point-compensation
                              use black point compensation
         -blue-primary point  chromaticity blue primary point
         -bordercolor color   border color
         -caption string      assign a caption to an image
         -cdl filename        color correct with a color decision list
         -clip                clip along the first path from the 8BIM profile
         -clip-mask filename  associate a clip mask with the image
         -clip-path id        clip along a named path from the 8BIM profile

```

# References

- https://superuser.com/questions/1469592/how-can-i-convert-a-pdf-into-a-series-of-images-jpgs-or-pngs-via-the-terminal
- https://superuser.com/questions/1469592/how-can-i-convert-a-pdf-into-a-series-of-images-jpgs-or-pngs-via-the-terminal
