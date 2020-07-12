import $ from 'jquery';

export default (params) => {
  const { type, color } = params;
  const size = params.size || 10;
  let svg;
  const rotate = `rotate(90 ${size / 2} ${size / 2})`;
  switch (type) {
    case 'dots':
      svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
          <circle cx="1" cy="1" r="1" fill="${color}"/>
        </svg>
      `;
      break;
    case 'verticalLines':
      svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='${size / 2}' height='${size}'>
          <rect x='0' y='0' width='1' height='${size}' fill='${color}' />
        </svg>
      `;
      break;
    case 'horizontalLines':
      svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size / 2}'>
          <rect x='0' y='0' width='${size}' height='1' fill='${color}' />
        </svg>
      `;
      break;
    case 'rightDiagonalLines':
      svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
          <path d='M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2' stroke='${color}' stroke-width='1'/>
        </svg>
      `;
      break;
    case 'leftDiagonalLines':
      svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
          <path d='M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2' stroke='${color}' stroke-width='1' transform="${rotate}"/>
        </svg>
      `;
      break;
    case 'rightSmallDiagonalLines':
      svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='5' height='5'>
          <path d='M0 5L5 0ZM6 4L4 6ZM-1 1L1 -1Z' stroke='${color}' stroke-width='1'/>
        </svg>
      `;
      break;
    case 'rhombus':
      svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>
          <path d='M0 0L8 8ZM8 0L0 8Z' stroke-width='0.5' stroke='${color}'/>
        </svg>
      `;
      break;
    default:
      return null;
  }
  const xml = (new XMLSerializer()).serializeToString($(svg)[0]);
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${xml}`;
  return image;
};
