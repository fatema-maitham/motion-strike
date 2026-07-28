export function rectanglesOverlap(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

export function birdHitPipe(bird, pipe) {
    const birdBounds = bird.getBounds();
    return (
        rectanglesOverlap(birdBounds, pipe.getTopBounds()) ||
        rectanglesOverlap(birdBounds, pipe.getBottomBounds())
    );
}