const header = $('header')
const startMenu = $('#start-menu')
const playBtn = $('#start-menu > #start')


class Player {
    constructor() {
        this.pos = 0
        this.verticalSpeed = 0
        this.incline = 0
        this.playerElem = $('#player')
        this.fly = false
        this.gameRun = false
        this.touchesTheTopEdge = false
        this.touchesTheBottomEdge = false


        // Fly on screen press
        onpointerdown = () => {
            if (this.gameRun) this.enableFly()
        }
        
        onpointerup = () => {
            if (this.gameRun) this.disableFly()
        }
    }

    enablePhysics() {
        // Gravitation
        this.gravitationIntervalId = setInterval((parentalThis) => {
            if ((parentalThis.verticalSpeed > -10) && !parentalThis.fly && !parentalThis.touchesTheBottomEdge) parentalThis.verticalSpeed -= 1
        }, 100, this);

        // Move player (inertia)
        this.inertiaIntervalId = setInterval((parentalThis) => {
            const screenHeight = $(window).height()
            const oldPosition = Number(parentalThis.playerElem.css('top').match(/-?[0-9]+/)[0])
            let newPosition = oldPosition - parentalThis.verticalSpeed

            if (newPosition > screenHeight) {
                newPosition = screenHeight
                parentalThis.touchesTheBottomEdge = true
                parentalThis.verticalSpeed = 0
            } else if (newPosition < 0) {
                newPosition = 0
                parentalThis.touchesTheTopEdge = true
                parentalThis.verticalSpeed = 0
            } else {
                parentalThis.touchesTheTopEdge = false
                parentalThis.touchesTheBottomEdge = false
            }

            parentalThis.playerElem.css('top', `${newPosition}px`)
        }, 1, this);
    }

    disablePhysics() {
        clearInterval(this.gravitationIntervalId) // Stop gravitation
        clearInterval(this.inertiaIntervalId) // Stop inertia
    }

    enableFly() {
        // Fly
        this.fly = true
        this.flyIntervalId = setInterval((parentalThis) => {
            if ((parentalThis.verticalSpeed < 10) && !parentalThis.touchesTheTopEdge) parentalThis.verticalSpeed += 1
        }, 100, this);
    }

    disableFly() {
        this.fly = false
        clearInterval(this.flyIntervalId) // Stop fly
    }
}


class Game {
    constructor(gravity = 10, horizontalSpeed = 1, HeightImitationSpeed = 5, backgroundImageSrc) {
        this.gravity = gravity
        this.horizontalSpeed = horizontalSpeed
        this.HeightImitationSpeed = HeightImitationSpeed
        this.background = $('#game-background')

        this.background.css('background-image', `url(${backgroundImageSrc || "../images/textures/background/background.jpg"})`)
    }

    startMoveBackground() {
        const backgroundImageWidth = getBackgroundImageSize(this.background)[0]

        // Move background
        this.backgroundMoveIntervalId = setInterval((parentalThis) => {
            const currentPosX = Number(parentalThis.background.css('background-position').match(/-?[0-9]+/)[0])
            let posX = currentPosX - parentalThis.horizontalSpeed
            if (posX <= -backgroundImageWidth) posX += backgroundImageWidth
            parentalThis.background.css('background-position', posX + 'px 0');
        }, 1, this);
    }

    stopMoveBackground() {
        clearInterval(this.backgroundMoveIntervalId)
    }
}


const game = new Game()
const player = new Player()

const startGame = () => {
    game.startMoveBackground()
    player.enablePhysics()
    player.gameRun = true
}

const stopGame = () => {
    game.stopMoveBackground()
    player.disablePhysics()
    player.gameRun = false
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

    setTimeout(startGame, 300); // Start game after 300 ms
})