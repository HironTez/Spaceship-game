let fps

const header = $('header')
const startMenu = $('#start-menu')
const restartMenu = $('#restart-menu')
const playBtn = $('#start-menu > #start')
const restartBtn = $('#restart-menu > #restart')
const fpsCounterElem = $('#fps-counter')[0]
const scoreCounterElem = $('#score-counter')[0]
let maxScore = localStorage['maxScore'] ? String(localStorage['maxScore']) : 0
const pointsTotal = $('#score-total')[0]


class Player {
    constructor(maxVerticalSpeed = 20, acceleration = 0.2) {
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

        if (newPosition >= screenHeight - 25) {
            newPosition = screenHeight - 25
            this.touchesTheBottomEdge = true
            this.verticalSpeed = 0
        } else if (newPosition <= 25) {
            newPosition = 25
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

    reset() {
        this.verticalSpeed = 0
        this.playerElem.css('top', `50%`)
        this.playerElem.css('transform', `translateY(-50%) rotate(90deg)`)
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
        this.obstacles = []
        this.score = 0
        this.startTime = Date.now()
        this.background = $('#game-background')

        this.background.css('background-image', `url(${backgroundImageSrc || "../images/textures/background/space.png"})`)
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
        // If it's time to spawn
        if (this.nextGenerateObstacleTime < Date.now() || !this.nextGenerateObstacleTime) {
            // Generate new params
            const radius = random(40, Math.min(200, Math.min($(document).height(), $(document).width()) - 60))
            const posY = random(0, 100)

            // Calculate distance between new and last obstacles
            const lastObstacle = this.obstacles[this.obstacles.length - 1]?.obstacleElem
            const lastObstaclePos = [Number(lastObstacle?.css('left')?.match(/-?[0-9\.]+/)[0]), Number(lastObstacle?.css('top')?.match(/-?[0-9\.]+/)[0]) / $(document).height() * 100]
            const distanceBetweenNewAndLastObstacles = findDistance($(document).width() + radius, posY, lastObstaclePos[0], lastObstaclePos[1]) - radius - (Number(lastObstacle?.css('width')?.match(/[0-9]+/)) / 2)
            // Create new obstacle if distance more then 60 or no more obstacles
            if (distanceBetweenNewAndLastObstacles >= 60 || !distanceBetweenNewAndLastObstacles) this.obstacles.push(new Obstacle(radius, posY))
            else { // Try to achieve the desired distance by reducing the radius
                const newRadius = radius - (60 - distanceBetweenNewAndLastObstacles)
                if (newRadius >= 40) this.obstacles.push(new Obstacle(newRadius, posY))
            }

            // Generate time to spawn next obstacle
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

    changeScore() {
        // Once a second
        if (Number(String(Date.now()).slice(-4, -3)) > Number(String(lastFrameTime).slice(-4, -3))) {
            this.score = Date.now() - this.startTime // Change score
            scoreCounterElem.innerText = 'Score: ' + (String(this.score).slice(0, -3) || '0') // Change value on the HTML element
        }
    }

    restart() {
        // Remove obstacles
        this.obstacles.length = 0
        // Remove obstacles dom elements
        $('#game>#obstacles').empty()
        // Reset score
        this.score = 0
        this.startTime = Date.now()
    }
}



const animationFrame = () => {
    if (!game.run) return

    player.physics()
    game.moveBackground()
    game.generateObstacles()
    game.moveObstacles()
    game.checkCollision()
    game.changeScore()

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
    game.run = false // Stop game

    // Show restart menu
    restartMenu.css('display', 'block')
    restartMenu.animate({ opacity: 1 }, 300)
    // Enable restart button
    restartBtn.attr('disabled', false)

    // Show header
    header.css('display', 'block')
    header.animate({
        opacity: 1,
        top: '0'
    }, 300)

    // Show score
    pointsTotal.innerText = 'Your score: ' + String(game.score).slice(0, -3)
    if (game.score > maxScore) {
        maxScore = game.score
        localStorage.setItem('maxScore', game.score)
        showPopup('New record')
    }
}

const restartGame = () => {
    fps = 0 // Reset fps
    lastFrameTime = 0 // Reset last frame time
    player.reset() // Reset player data
    game.restart() // Reset game data
    game.run = true // Run game
    requestAnimationFrame(animationFrame) // Start animation frames
}


// On press start button
playBtn.on('click', () => {
    // Disable button
    playBtn.attr("disabled", true)

    // Hide start menu
    startMenu.animate({
        opacity: 0
    }, {
        duration: 300,
        complete: () => {
            startMenu.css('display', 'none')
        }
    })

    // Hide header
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


// On press restart button
restartBtn.on('click', () => {
    // Disable button
    restartBtn.attr('disabled', true)

    // Hide restart menu
    restartMenu.animate({
        opacity: 0
    }, {
        duration: 300,
        complete: () => {
            startMenu.css('display', 'none')
        }
    })

    // Hide header
    header.animate({
        opacity: 0,
        top: '-10%'
    }, {
        duration: 300,
        complete: () => {
            header.css('display', 'none')
        }
    })

    // Restart game after 300 ms
    setTimeout(restartGame, 300)
})


// Open select textures menu
$('.select-textures').on('click', (e) => {
    const targetIsWhatWeNeed = ($(e.target).hasClass('select-textures')) || ($(e.target).hasClass('texture-preview'))
    if (!targetIsWhatWeNeed) return
    target = $(e.target).hasClass('select-textures') ? $(e.target) : $(e.target).parent()
    
    target.children('.textures-list').css('display', 'flex')
    target.children('.textures-list').animate({opacity: 1}, {
        duration: 300,
        complete: () => {
            target.children('.textures-list').addClass('active')
        }
    })
})


// Close all active tabs
$(document).on('click', (e) => {
    if (game.run) return // Exit if game run

    const target = $(e.target)
    activeTargetsParent = target.parents('.active')[0]
    // Close all active tabs which is not parents for target element
    const activeTabs = $('.active')
    // Filter active tabs
    const activeTabsNotParents = activeTabs.filter((i) => {
        const elem = activeTabs[i]
        return elem != activeTargetsParent
    })
    // If there is active tabs which is not parents for target element
    if (activeTabsNotParents.length > 0) {
        // Close them
        activeTabsNotParents.removeClass('active')
        activeTabsNotParents.animate({opacity: 0}, {
            duration: 300,
            complete: () => {
                activeTabsNotParents.css('display', 'none')
            }
        })
    }
})


// Change texture to selected
$('.texture-icon').on('click', (e) => {
    const target = $(e.target)
    const newSrc = target.attr('src')
    target.parents('.select-textures').children('.texture-preview').attr('src', newSrc)
    if (target.hasClass('skin')) {
        if (newSrc == player.playerElem.attr('src')) return
        player.playerElem.attr('src', newSrc)
    } else if (target.hasClass('background')) {
        if (newSrc == game.background.attr('src')) return
        game = new Game(10, 3, 5, newSrc)
    }
})