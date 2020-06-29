/* eslint-disable comma-dangle */
import inside from 'point-in-polygon';

function getXYStraight(x1, y1, x2, y2, R) {
  const dX = x1 - x2;
  const dX2 = dX ** 2;
  const dY = y1 - y2;
  const dY2 = dY ** 2;
  const coordsSum = dX2 + dY2;
  const R2 = R ** 2;
  const x = 0.5 * (
    (x1 + x2 - (1 / coordsSum)
      * (
        Math.sqrt(
          -coordsSum
          * (
            dX2 + 4 * R2
            * (
              -2 + Math.sqrt(
                -1 * ((-4 * R2 + coordsSum) / R2)
              )
            ) + dY2
          ) * dY2
        )
      )
    )
  );
  const y = (
    dX2 * (y1 ** 2) + y1 ** 4
    + x1 * Math.sqrt(
      (
        -coordsSum
        * (
          dX2 + 4 * R2
          * (
            -2 + Math.sqrt(
              -1 * ((-4 * R2 + coordsSum) / R2)
            )
          ) + dY2
        ) * dY2
      )
    )
    - x2 * Math.sqrt(
      (
        -coordsSum
        * (
          dX2 + 4 * R2
          * (
            -2 + Math.sqrt(
              -1 * ((-4 * R2 + coordsSum) / R2)
            )
          ) + dY2
        ) * dY2
      )
    )
    - 2 * (y1 ** 3) * y2 + 2 * y1 * (y2 ** 3) - (y2 ** 2) * (dX2 + (y2 ** 2))
  ) / (2 * coordsSum * dY);
  return [x, y];
}

function getXYReverse(x1, y1, x2, y2, R) {
  const dX = x1 - x2;
  const dX2 = dX ** 2;
  const dY = y1 - y2;
  const dY2 = dY ** 2;
  const coordsSum = dX2 + dY2;
  const R2 = R ** 2;
  const x = 0.5 * (
    (x1 + x2 + (1 / coordsSum)
      * (
        Math.sqrt(
          -coordsSum
          * (
            dX2 + 4 * R2
            * (
              -2 + Math.sqrt(
                -1 * ((-4 * R2 + coordsSum) / R2)
              )
            ) + dY2
          ) * dY2
        )
      )
    )
  );
  const y = (
    dX2 * (y1 ** 2) + y1 ** 4
    - x1 * Math.sqrt(
      (
        -coordsSum
        * (
          dX2 + 4 * R2
          * (
            -2 + Math.sqrt(
              -1 * ((-4 * R2 + coordsSum) / R2)
            )
          ) + dY2
        ) * dY2
      )
    )
    + x2 * Math.sqrt(
      (
        -coordsSum
        * (
          dX2 + 4 * R2
          * (
            -2 + Math.sqrt(
              -1 * ((-4 * R2 + coordsSum) / R2)
            )
          ) + dY2
        ) * dY2
      )
    )
    - 2 * (y1 ** 3) * y2 + 2 * y1 * (y2 ** 3) - (y2 ** 2) * (dX2 + (y2 ** 2))
  ) / (2 * coordsSum * dY);
  return [x, y];
}

function getXYStraightWithY0(x1, y1, x2, y2, R) {
  const x = (x1 + x2) / 2;
  const y = y1 + R * (
    1 - (
      Math.sqrt(
        1 - ((x2 - x1) ** 2) / (4 * (R ** 2))
      )
    )
  );
  return [x, y];
}

function getXYReverseWithY0(x1, y1, x2, y2, R) {
  const x = (x1 + x2) / 2;
  const y = y1 - R * (
    1 - (
      Math.sqrt(
        1 - ((x2 - x1) ** 2) / (4 * (R ** 2))
      )
    )
  );
  return [x, y];
}

function getIntermedPoint(x1, y1, x2, y2, R, isReverse, isYDelta0) {
  // console.log(x1, y1, x2, y2, R, isReverse, isYDelta0);
  let point;
  if (!isReverse) {
    point = isYDelta0
      ? getXYStraightWithY0(x1, y1, x2, y2, R)
      : getXYStraight(x1, y1, x2, y2, R);
  } else {
    point = isYDelta0
      ? getXYReverseWithY0(x1, y1, x2, y2, R)
      : getXYReverse(x1, y1, x2, y2, R);
  }
  return point;
}

// function circleCenter(x1, y1, x2, y2, x3, y3, x4, y4) {
//   // Check if none of the lines are of length 0
//   if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
//     return false;
//   }
//   const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
//   // Lines are parallel
//   if (denominator === 0) {
//     return false;
//   }
//   const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
//   const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
//   // is the intersection along the segments
//   if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
//     return false;
//   }
//   // Return a object with the x and y coordinates of the intersection
//   const x = x1 + ua * (x2 - x1);
//   const y = y1 + ua * (y2 - y1);
//   return { x, y };
// }

// function getLinearEquation(x1, y1, x2, y2) {
//   // y = mx + n - формула линейного уравнения
//   const m = (y2 - y1) / (x2 - x1);
//   const n = -x1 * ((y2 - y1) / (x2 - x1)) + y1;
//   return { m, n };
// }

export default (pointsAB, radius, direction, polygonPoints) => {
  const [x1, y1, x2, y2] = pointsAB;
  const R = Math.round(radius);
  const isYDelta0 = y1 === y2;
  let XY1 = isYDelta0
    ? getXYStraightWithY0(x1, y1, x2, y2, R)
    : getXYStraight(x1, y1, x2, y2, R);
  const realDirection = inside(XY1, polygonPoints) ? 'inside' : 'outside';
  let isReverse = false;
  if (realDirection !== direction) {
    XY1 = isYDelta0
      ? getXYReverseWithY0(x1, y1, x2, y2, R)
      : getXYReverse(x1, y1, x2, y2, R);
    isReverse = true;
  }
  const point2 = getIntermedPoint(x1, y1, ...XY1, R, isReverse, isYDelta0);
  // console.log(point2, x1, y1);
  const point1 = getIntermedPoint(x1, y1, ...point2, R, isReverse, isYDelta0);
  // console.log(point1, x1, y1);
  const point3 = getIntermedPoint(...point2, ...XY1, R, isReverse, isYDelta0);
  const point6 = getIntermedPoint(...XY1, x2, y2, R, isReverse, isYDelta0);
  const point5 = getIntermedPoint(...XY1, ...point6, R, isReverse, isYDelta0);
  const point7 = getIntermedPoint(...point6, x2, y2, R, isReverse, isYDelta0);
  const allPoints = [
    point1, point2, point3, XY1, point5, point6, point7
  ];

  // new Array(2).fill(null).forEach((_, i) => {
  //   let A = !i ? [x1, y1] : XY1;
  //   let B = !i ? XY1 : [x2, y2];
  //   new Array(3).fill(null).forEach(() => {
  //     let point;
  //     if (!isReverse) {
  //       point = isYDelta0
  //         ? getXYStraightWithY0(x1, y1, XY1[0], XY1[1], R)
  //         : getXYStraight(x1, y1, XY1[0], XY1[1], R);
  //     } else {
  //       point = isYDelta0
  //         ? getXYReverseWithY0(x1, y1, XY1[0], XY1[1], R)
  //         : getXYReverse(x1, y1, XY1[0], XY1[1], R);
  //     }
  //     allPoint.push(point);
  //   });
  // });

  // let XY0;
  // let XY2;
  // if (!isReverse) {
  //   XY0 = isYDelta0
  //     ? getXYStraightWithY0(x1, y1, XY1[0], XY1[1], R)
  //     : getXYStraight(x1, y1, XY1[0], XY1[1], R);
  // } else {
  //   XY0 = isYDelta0
  //     ? getXYReverseWithY0(x1, y1, XY1[0], XY1[1], R)
  //     : getXYReverse(x1, y1, XY1[0], XY1[1], R);
  // }
  // if (!isReverse) {
  //   XY2 = isYDelta0
  //     ? getXYStraightWithY0(XY1[0], XY1[1], x2, y2, R)
  //     : getXYStraight(XY1[0], XY1[1], x2, y2, R);
  // } else {
  //   XY2 = isYDelta0
  //     ? getXYReverseWithY0(XY1[0], XY1[1], x2, y2, R)
  //     : getXYReverse(XY1[0], XY1[1], x2, y2, R);
  // }
  // return [XY0, XY1, XY2];
  return allPoints;
};
