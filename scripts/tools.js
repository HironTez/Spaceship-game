const getBackgroundImageSize = (object) => {
    const imageSrc = object
        .css('backgroundImage').replace(/url\((['"])?(.*?)\1\)/gi, '$2')
        .split(',')[0]

    const image = new Image()
    image.src = imageSrc

    const width = image.width,
        height = image.height
    return [width, height]
}


let lastFrameTime

// Calculate fps
const fpsCounter = () => {
    if (!lastFrameTime) {
        lastFrameTime = Date.now()
        fps = 0
        return
    }
    delta = (Date.now() - lastFrameTime) / 1000
    fps = 1 / delta

    // Write value to html tag
    if (Number(String(Date.now()).slice(-4, -3)) > Number(String(lastFrameTime).slice(-4, -3))) fpsCounterElem.innerText = `FPS: ${Math.round(fps)}`
    lastFrameTime = Date.now() // Set new value
}


// Calculate the animation data relative to the fps
const shiftRelativeToFPS = (data) => {
    return fps ? data / 100 * (100 / fps * 100) : 0
}


// Function to check if any polet overlaps the given circle and rectangle
const checkOverlap = (R, Xc, Yc, X1, Y1, X2, Y2) => {
    // Find the nearest polet on the rectangle to the center of the circle
    let Xn = Math.max(X1, Math.min(Xc, X2));
    let Yn = Math.max(Y1, Math.min(Yc, Y2));
       
    // Find the distance between the nearest polet and the center of the circle
    // Distance between 2 polets, (x1, y1) & (x2, y2) in 2D Euclidean space is ((x1-x2)**2 + (y1-y2)**2)**0.5
    let Dx = Xn - Xc;
    let Dy = Yn - Yc;
    return (Dx * Dx + Dy * Dy) <= R * R;
}