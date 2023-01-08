import turtle

# Set up the screen
wn = turtle.Screen()
wn.bgcolor("black")
wn.title("Block Breaker")

# Draw the border
border_pen = turtle.Turtle()
border_pen.speed(0)
border_pen.color("white")
border_pen.penup()
border_pen.setposition(-300, -300)
border_pen.pendown()
border_pen.pensize(3)
for side in range(4):
    border_pen.fd(600)
    border_pen.lt(90)
border_pen.hideturtle()

# Set the paddle
paddle = turtle.Turtle()
paddle.speed(0)
paddle.shape("square")
paddle.color("blue")
paddle.shapesize(stretch_wid=1, stretch_len=5)
paddle.penup()
paddle.goto(0, -250)

# Set the ball
ball = turtle.Turtle()
ball.speed(0)
ball.shape("circle")
ball.color("red")
ball.penup()
ball.goto(0, 0)
ball.dx = 2
ball.dy = -2

# Create blocks
block_list = []
block_color = ["red", "orange", "yellow", "green", "blue"]
for i in range(-280, 280, 70):
    for j in range(260, 140, -40):
        new_block = turtle.Turtle()
        new_block.speed(0)
        new_block.shape("square")
        new_block.color(block_color[i // 70])
        new_block.penup()
        new_block.goto(i, j)
        block_list.append(new_block)

# Set the score to 0
score = 0

# Draw the score
score_pen = turtle.Turtle()
score_pen.speed(0)
score_pen.color("white")
score_pen.penup()
score_pen.setposition(-290, 280)
score_string = "Score: %s" % score
score_pen.write(score_string, False, align="left",
                font=("Arial", 14, "normal"))
score_pen.hideturtle()

# Move the paddle
def move_left():
    x = paddle.xcor()
    x -= 40
    if x < -280:
        x = -280
    paddle.setx(x)

def move_right():
    x = paddle.xcor()
    x += 40
    if x > 280:
        x = 280
    paddle.setx(x)

# Keyboard bindings
wn.listen()
wn.onkeypress(move_left, "Left")
wn.onkeypress(move_right, "Right")

# Set the ball speed to 2
speed = 2

# Main game loop
while True:
    wn.update()

    # Increase the ball speed
    speed += 0.01

    # Move the ball
    ball.setx(ball.xcor() + ball.dx * speed)
    ball.sety(ball.ycor() + ball.dy * speed)

    # Border collision checking
    if ball.ycor() > 290:
        ball.sety(290)
        ball.dy *= -1

    if ball.ycor() < -290:
        # Game over
        game_over_pen = turtle.Turtle()
        game_over_pen.speed(0)
        game_over_pen.color("white")
        game_over_pen.penup()
        game_over_pen.setposition(0, 0)
        game_over_string = "Game Over"
        game_over_pen.write(game_over_string, False, align="center", font=("Arial", 24, "normal"))
        game_over_pen.hideturtle()
        break

    if ball.xcor() > 290:
        ball.setx(290)
        ball.dx *= -1

    if ball.xcor() < -290:
        ball.setx(-290)
        ball.dx *= -1

    # Paddle and ball collision checking
    if ball.ycor() < -240 and (paddle.xcor() - 50 < ball.xcor() < paddle.xcor() + 50):
        ball.sety(-240)
        ball.dy *= -1

    # Check for ball and block collision
    for block in block_list:
        if block.distance(ball) < 20:
            ball.dy *= -1
            block_list.remove(block)
            block.hideturtle()
            score += 10

    # Update the score display
    score_string = "Score: %s" %score
    score_pen.clear()
    score_pen.write(score_string, False, align="left", font=("Arial", 14, "normal"))
