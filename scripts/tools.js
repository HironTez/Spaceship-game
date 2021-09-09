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
const checkOverlap = (pointX, pointY, radius, rectX, rectY, rectOffsetX, rectOffsetY, rectWidth, rectHeight, rectAngle) => {
    const relX = pointX - rectX
    const relY = pointY - rectY
    const angle = -rectAngle
    const angleCos = Math.cos(angle)
    const angleSin = Math.sin(angle)
    const localX = angleCos * relX - angleSin * relY
    const localY = angleSin * relX + angleCos * relY
    const beyondCorners = Math.sqrt((relX ** 2) + (relY ** 2)) > (Math.sqrt((rectWidth ** 2) + (rectHeight ** 2)) / 2 + radius)
    return localX >= -rectOffsetX - radius && localX - radius <= rectWidth - rectOffsetX &&
        localY >= -rectOffsetY - radius && localY <= rectHeight - rectOffsetY + radius && !beyondCorners;
}


// Get current css rotation of element in radians
const getCurrentRotationInDeg = (el) => {
    var st = window.getComputedStyle(el, null)
    var tr = st.getPropertyValue("-webkit-transform") ||
        st.getPropertyValue("-moz-transform") ||
        st.getPropertyValue("-ms-transform") ||
        st.getPropertyValue("-o-transform") ||
        st.getPropertyValue("transform")

    if (tr !== "none") {
        var values = tr.split('(')[1]
        values = values.split(')')[0]
        values = values.split(',')
        var a = values[0]
        var b = values[1]

        return Math.atan2(b, a)

    } else {
        return 0
    }
}


const random = (min = 0, max = 100) => {
    return Math.floor(Math.random() * ((max + 1) - min) ) + min
}