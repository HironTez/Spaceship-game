let fps

const header = $('header')
const startMenu = $('#start-menu')
const playBtn = $('#start-menu > #start')
const fpsCounterElem = $('#fps-counter')[0]


class Player {
    constructor(maxVerticalSpeed = 20, acceleration = 0.5) {
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
        this.playerElem.css('transform', `translateY(-50%) rotate(${-(60 / 100 * (this.verticalSpeed / this.maxVerticalSpeed * 100)) + 90}deg)`)

        // Fly
        if (this.fly && (this.verticalSpeed < this.maxVerticalSpeed) && !this.touchesTheTopEdge) this.verticalSpeed += accelerationNow
    }
}


class Obstacle {
    constructor(radius = 100, posY = 50, rotationSpeed) {
        this.active = true
        // Validate arguments (x = x < max ? max : (x > min ? x : min))
        this.radius = radius > 200 ? 200 : (radius > 40 ? radius : 40)
        this.posY = posY > 100 ? 100 : (posY > 0 ? posY : 0)
        // Create new obstacle
        this.obstacleElem = $('<img class="obstacle" src="./images/textures/asteroids/asteroid.png"></img>')
        this.obstacleElem.css({ 'width': this.radius * 2, 'height': this.radius * 2, 'top': `${this.posY}%`, 'left': `calc(100% + ${this.radius}px)` }) // Set parameters
        $('#game>#obstacles').append(this.obstacleElem) // Add to HTML
    }
}


class Game {
    constructor(gravity = 10, horizontalSpeed = 3, HeightImitationSpeed = 5, backgroundImageSrc) {
        this.run = false
        this.gravity = gravity
        this.horizontalSpeed = horizontalSpeed
        this.HeightImitationSpeed = HeightImitationSpeed
        this.fps = 0
        this.obstacles = []
        this.background = $('#game-background')

        this.background.css('background-image', `url(${backgroundImageSrc || "../images/textures/background/background.jpg"})`)
        const backgroundImageSize = getBackgroundImageSize(this.background)
        this.backgroundWidth = (backgroundImageSize[0] / 100 * ($(document).height() / backgroundImageSize[1] * 100))
    }

    moveBackground() {
        // Move background
        const currentPosX = Number(this.background.css('background-position').match(/-?[0-9\.]+/)[0])
        let newPosX = currentPosX - shiftRelativeToFPS(this.horizontalSpeed)
        if (newPosX <= -this.backgroundWidth) newPosX += this.backgroundWidth
        this.background.css('background-position', newPosX + 'px 0')
    }

    generateObstacles() {
        if (this.nextGenerateObstacleTime < Date.now() || !this.nextGenerateObstacleTime) {
            const radius = random(40, 200)
            const posY = random(0, 100)
            this.obstacles.push(new Obstacle(radius, posY))
            this.nextGenerateObstacleTime = Date.now() + random(500, 2000)
        }
    }

    moveObstacles() {
        for (const obstacle of this.obstacles) {
            // Calculate new position
            const currentPosX = Number(obstacle.obstacleElem.css('left').match(/-?[0-9\.]+/)[0])
            const newPosX = currentPosX - shiftRelativeToFPS(this.horizontalSpeed)
            // Remove the object if it disappeared off the screen
            if (newPosX < (0 - (Number(obstacle.obstacleElem.css('width').match(/[0-9]+/)[0]) / 2))) {
                obstacle.obstacleElem.remove()
                obstacle.active = false
            }
            // Change position
            obstacle.obstacleElem.css('left', `${newPosX}px`)
        }
    }

    checkCollision() {
        for (const obstacle of this.obstacles) {
            if (!obstacle.active) { // Remove a obstacle from list if it's inactive
                this.obstacles.splice($.inArray(obstacle, this.obstacles), 1)
                continue
            }
            // Calculate the position of the obstacle where collision is possible
            const collisionPosX = (
                Number(player.playerElem.css('left').match(/[0-9\.]+/)[0]) -
                player.playerElem.height() / 2 +
                Math.sqrt((player.playerElem.height() ** 2) +
                    (player.playerElem.width() ** 2))) +
                (obstacle.obstacleElem.width() / 2)
            // Calculate the position of the obstacle where the collision is no longer possible
            const collisionIsNoLongerPossible = Number(player.playerElem.css('left').match(/[0-9\.]+/)[0]) +
                player.playerElem.height() / 2 -
                Math.sqrt((player.playerElem.height() ** 2) +
                    (player.playerElem.width() ** 2))
            // Get obstacle x position
            const obstaclePosX = Number(obstacle.obstacleElem.css('left').match(/-?[0-9\.]+/)[0])

            // If an obstacle is in the collision zone
            const obstacleClose = collisionPosX >= obstaclePosX
            const obstacleBehind = collisionIsNoLongerPossible > (obstaclePosX + obstacle.obstacleElem.width() / 4)
            if (obstacleClose && !obstacleBehind) {
                // Data preparation
                const obstaclePos = [obstaclePosX, Number(obstacle.obstacleElem.css('top').match(/-?[0-9\.]+/)[0])]
                const obstacleRadius = obstacle.radius
                const rectangleSize = [50, Number(player.playerElem.css('height').match(/[0-9]+/)[0])]
                const rectanglePos = [Number(player.playerElem.css('left').match(/-?[0-9\.]+/)[0]) + rectangleSize[1] / 2, Number(player.playerElem.css('top').match(/-?[0-9\.]+/)[0])]
                const rectangleRotate = getCurrentRotationInDeg(player.playerElem[0]) - Math.PI / 2
                // Check collision
                if (checkOverlap(obstaclePos[0], obstaclePos[1], obstacleRadius, rectanglePos[0], rectanglePos[1], rectangleSize[1] / 2, rectangleSize[0] / 2, rectangleSize[1], rectangleSize[0], rectangleRotate)) {
                    stopGame()
                }
            }
        }
    }
}



const animationFrame = () => {
    if (!game.run) return

    player.physics()
    game.moveBackground()
    game.generateObstacles()
    game.moveObstacles()
    game.checkCollision()

    requestAnimationFrame(animationFrame)
    fpsCounter()
}


const game = new Game()
const player = new Player(20, 0.2)

const startGame = () => {
    game.run = true
    requestAnimationFrame(animationFrame)
}

const stopGame = () => {
    game.run = false
}


// On press start button
playBtn.on('click', () => {
    // Disable button
    playBtn.attr("disabled", true)

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

    // Start game after 300 ms
    setTimeout(startGame, 300)
})