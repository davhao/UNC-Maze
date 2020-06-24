const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHoriz = 15;
const cellsVert = 8;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLengthX = width / cellsHoriz;
const unitLengthY = height / cellsVert;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element : document.body,
	engine  : engine,
	options : {
		wireframes : false,
		width      : width,
		height     : height,
		background : '#a2cafe'
	}
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

// Maze Generation
const shuffle = (arr) => {
	let counter = arr.length;

	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);
		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}

	return arr;
};

const grid = Array(cellsVert).fill(null).map(() => Array(cellsHoriz).fill(false));
const verticals = Array(cellsVert).fill(null).map(() => Array(cellsHoriz - 1).fill(false));
const horizontals = Array(cellsVert - 1).fill(null).map(() => Array(cellsHoriz).fill(false));

console.log(grid, verticals, horizontals);

const startRow = Math.floor(Math.random() * cellsVert);
const startColumn = Math.floor(Math.random() * cellsHoriz);

console.log(startRow, startColumn);

const stepThroughCell = (row, column) => {
	// If visited, return
	if (grid[row][column]) {
		return;
	}

	// Mark cell as visited
	grid[row][column] = true;

	// Assemble randomly-orderd list of neighbors
	const neighbors = shuffle([
		[
			row - 1,
			column,
			'up'
		],
		[
			row + 1,
			column,
			'down'
		],
		[
			row,
			column - 1,
			'left'
		],
		[
			row,
			column + 1,
			'right'
		]
	]);

	// For each neighbor...
	for (let neighbor of neighbors) {
		const [
			nextRow,
			nextColumn,
			direction
		] = neighbor;

		// See if neighbor is out of bounds
		if (nextRow < 0 || nextRow >= cellsVert || nextColumn < 0 || nextColumn >= cellsHoriz) {
			continue;
		}

		// If have visited, continue to next neighbor
		if (grid[nextRow][nextColumn]) {
			continue;
		}

		// Remove wall from either horizontals or verticals
		switch (direction) {
			case 'left':
				verticals[row][column - 1] = true;
				break;
			case 'right':
				verticals[row][column] = true;
				break;
			case 'up':
				horizontals[row - 1][column] = true;
				break;
			case 'down':
				horizontals[row][column] = true;
		}

		// Visit next cell
		stepThroughCell(nextRow, nextColumn);
	}
};

stepThroughCell(startRow, startColumn);

console.log(grid, verticals, horizontals);

// Draw walls
horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle((columnIndex + 0.5) * unitLengthX, (rowIndex + 1) * unitLengthY, unitLengthX, 5, {
			isStatic : true,
			label    : 'wall',
			render   : {
				fillStyle : '#5893d2'
			}
		});
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			(columnIndex + 1) * unitLengthX,
			(rowIndex + 0.5) * unitLengthY,
			5,
			unitLengthY + 5,
			{
				isStatic : true,
				label    : 'wall',
				render   : {
					fillStyle : '#5893d2'
				}
			}
		);
		World.add(world, wall);
	});
});

// Goal

const goal = Bodies.rectangle(
	width - unitLengthX * 0.5,
	height - unitLengthY * 0.5,
	unitLengthX * 0.7,
	unitLengthY * 0.7,
	{
		isStatic : true,
		label    : 'goal',
		render   : {
			fillStyle : 'green'
		}
	}
);
World.add(world, goal);

// Ball

const ballRadius = Math.min(unitLengthX, unitLengthY) * 0.25;
const ball = Bodies.circle(unitLengthX * 0.5, unitLengthY * 0.5, ballRadius, {
	label  : 'ball',
	render : {
		fillStyle : 'white'
	}
});
World.add(world, ball);

document.addEventListener('keydown', (event) => {
	const { x, y } = ball.velocity;
	switch (event.keyCode) {
		case 87:
		case 38:
			Body.setVelocity(ball, { x, y: y - 5 });
			break;
		case 68:
		case 39:
			Body.setVelocity(ball, { x: x + 5, y });
			break;
		case 83:
		case 40:
			Body.setVelocity(ball, { x, y: y + 5 });
			break;
		case 65:
		case 37:
			Body.setVelocity(ball, { x: x - 5, y });
	}
});

// Win Condition

Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = [
			'ball',
			'goal'
		];

		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});
			document.querySelector('.winner').classList.remove('hidden');
		}
	});
});
