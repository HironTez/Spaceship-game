var getBackgroundImageSize = (object) => {
    const imageSrc = object
        .css('backgroundImage').replace(/url\((['"])?(.*?)\1\)/gi, '$2')
        .split(',')[0]

    const image = new Image()
    image.src = imageSrc

    const width = image.width,
        height = image.height
    return [width, height]
}