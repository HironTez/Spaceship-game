let fps

const header = $('header')
const startMenu = $('#start-menu')
const playBtn = $('#start-menu > #start')
const fpsCounterElem = $('#fps-counter')[0]


class Player {
    constructor(maxVerticalSpeed = 20, acceleration = 0.5) {
        this.pos = 0
        this.verticalSpeed = 0
        this.acceleration = acceleration
        this.maxVerticalSpeed = maxVerticalSpeed
        this.incline = 0
        this.playerElem = $('#player')
        this.fly = false
        this.touchesTheTopEdge = false
        this.touchesTheBottomEdge = false


        // Fly on screen press
        onpointerdown = () => {
            this.fly = true
        }

        onpointerup = () => {
            this.fly = false
        }
    }

    physics() {
        // Calculate acceleration relative to fps
        const accelerationNow = shiftRelativeToFPS(this.acceleration)

        // Gravitation
        if ((this.verticalSpeed > -this.maxVerticalSpeed) && !this.fly && !this.touchesTheBottomEdge) this.verticalSpeed -= accelerationNow
        
        // Move player (inertia)
        const screenHeight = $(window).height()
        const oldPosition = Number(this.playerElem.css('top').match(/-?[0-9]+/)[0])
        let newPosition = oldPosition - this.verticalSpeed

        if (newPosition >= screenHeight) {
            newPosition = screenHeight
            this.touchesTheBottomEdge = true
            this.verticalSpeed = 0
        } else if (newPosition <= 0) {
            newPosition = 0
            this.touchesTheTopEdge = true
            this.verticalSpeed = 0
        } else {
            this.touchesTheTopEdge = false
            this.touchesTheBottomEdge = false
        }

        this.playerElem.css('top', `${newPosition}px`)

        // Player inclination
        this.playerElem.css('transform', `translateY(-50%) rotate(${-(60 / 100 * (this.verticalSpeed / this.maxVerticalSpeed * 100))}deg)`)

        // Fly
        if (this.fly && (this.verticalSpeed < this.maxVerticalSpeed) && !this.touchesTheTopEdge) this.verticalSpeed += accelerationNow
    }
}


class Game {
    constructor(gravity = 10, horizontalSpeed = 3, HeightImitationSpeed = 5, backgroundImageSrc) {
        this.run = false
        this.gravity = gravity
        this.horizontalSpeed = horizontalSpeed
        this.HeightImitationSpeed = HeightImitationSpeed
        this.fps = 0
        this.background = $('#game-background')

        this.background.css('background-image', `url(${backgroundImageSrc || "../images/textures/background/background.jpg"})`)
        const backgroundImageSize = getBackgroundImageSize(this.background)
        this.backgroundWidth = (backgroundImageSize[0] / 100 * ($(document).height() / backgroundImageSize[1] * 100))
    }

    moveBackground() {
        // Move background
        const currentPosX = Number(this.background.css('background-position').match(/-?[0-9]+/)[0])
        let newPosX = currentPosX - shiftRelativeToFPS(this.horizontalSpeed)
        if (newPosX <= -this.backgroundWidth) newPosX += this.backgroundWidth
        this.background.css('background-position', newPosX + 'px 0');
    }

    moveObstacle() {
        for (const obstacle of $('.obstacle')) {

        }
    }
}


const animationFrame = () => {
    if (!game.run) return

    player.physics()
    game.moveBackground()

    requestAnimationFrame(animationFrame)
    fpsCounter()
}


const game = new Game()
const player = new Player()

const startGame = () => {
    game.run = true
    requestAnimationFrame(animationFrame)
}

const stopGame = () => {
    game.run = false
}


// On press start button
playBtn.on('click', () => {
    // Hide menu animation
    startMenu.animate({
        opacity: 0
    }, {
        duration: 300,
        complete: () => {
            startMenu.css('display', 'none')
        }
    })

    // Hide header animation
    header.animate({
        opacity: 0,
        top: '-10%'
    }, {
        duration: 300,
        complete: () => {
            header.css('display', 'none')
        }
    })

    setTimeout(startGame, 300) // Start game after 300 ms
})