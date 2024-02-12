import { EndOfLineState } from "typescript";
import { Entity } from "./entity";
import { Point } from "./point";

const MAX_DETPH = 5;

export class QuadTree {
  subTrees: null | [QuadTree, QuadTree, QuadTree, QuadTree]
  occupants: null | Entity[]
  min: Point
  max: Point
  depth: number

  constructor(min: Point, max: Point, depth: number = 0) {
    this.subTrees = null;
    this.occupants = [];

    this.min = min;
    this.max = max;

    this.depth = depth;
  }

  private addToSubTrees(entity: Entity) {
    this.subTrees![0].insert(entity); // sue me!
    this.subTrees![1].insert(entity);
    this.subTrees![2].insert(entity);
    this.subTrees![3].insert(entity);
  }

  public insert(entity: Entity) {
    // Entity must be in bounds of the tree
    if (!this.inBounds(entity)) {
      return;
    }

    // This layer had too many entities, insert into subtrees
    if (this.occupants === null) {
      this.addToSubTrees(entity);
      return;
    }

    // Layer has space for another entity or max depth of tree found
    if (this.occupants.length < 4 || this.depth >= MAX_DETPH) {
      this.occupants.push(entity);
      return
    }

    // Layer would be overfull with the new entity. Create sub-trees and add 
    // occupants and new entityt to those sub-trees
    const newDepth = this.depth + 1;
    const midX = (this.min.x + this.max.x) / 2;
    const midY = (this.min.y + this.max.y) / 2;

    this.subTrees = [
      new QuadTree(new Point(midX, this.min.y), new Point(this.max.x, midY), newDepth), // North-East
      new QuadTree(new Point(this.min.x, this.min.y), new Point(midX, midY), newDepth), // North-West
      new QuadTree(new Point(midX, midY), new Point(this.max.x, this.max.y), newDepth), // South-East
      new QuadTree(new Point(this.min.x, midY), new Point(midX, this.max.y), newDepth), // South-West
    ];

    this.addToSubTrees(this.occupants[0]); // sue me!!
    this.addToSubTrees(this.occupants[1]);
    this.addToSubTrees(this.occupants[2]);
    this.addToSubTrees(this.occupants[3]);
    this.addToSubTrees(entity);

    this.occupants = null;
  }

  public physicsUpdate(): void {
    if (this.occupants === null) {
      this.subTrees![0].physicsUpdate(); // sue me!!!
      this.subTrees![1].physicsUpdate();
      this.subTrees![2].physicsUpdate();
      this.subTrees![3].physicsUpdate();

      return;
    }

    const size = this.occupants!.length;
    for (let i = 0; i < size; ++i) {
      const e = this.occupants![i];
      for (let jj = i + 1; jj < size; ++jj) {
        e.collision(this.occupants![jj]);
      }
    }
  }

  private inBounds(entity: Entity): boolean {
    // const cx = entity.pos.x;
    // const cy = entity.pos.y;
    let cx = entity.pos.x;
    let cy = entity.pos.y;
    const r = entity.mass;

    if (cx < this.min.x) {
      cx = this.min.x;
    } else if (cx > this.max.x) {
      cx = this.max.x;
    }

    if (cy < this.min.y) {
      cy = this.min.y;
    } else if (cy > this.max.x) {
      cy = this.max.y;
    }

    const dx = cx - entity.pos.x;
    const dy = cy - entity.pos.y;

    return dx * dx + dy * dy <= r * r;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.beginPath(); // rect was super slow for some reason
    ctx.moveTo(this.min.x, this.min.y);
    ctx.lineTo(this.max.x, this.min.y);
    ctx.lineTo(this.max.x, this.max.y);
    ctx.lineTo(this.min.x, this.max.y);
    ctx.lineTo(this.min.x, this.min.y);
    ctx.closePath();
    ctx.stroke();

    if (this.subTrees !== null) {
      for (let i = 0; i < 4; ++i) {
        this.subTrees[i].render(ctx);
      }
    }
  }
}
