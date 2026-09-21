/**
 * SCENE MATTERS CMS - LAYOUT ENGINE (FINAL)
 */

function splitTextIntoChunks(paragraphs, numChunks) {
  if (!paragraphs || paragraphs.length === 0) return Array(numChunks).fill('');
  if (numChunks === 1) return [paragraphs.map(p => `<p>${p}</p>`).join('')];
  
  const total = paragraphs.reduce((sum, p) => sum + p.length, 0);
  let chunks = []; let currentChunk = []; let currentLen = 0;
  let targetLen = total / numChunks;
  
  for (let i = 0; i < paragraphs.length; i++) {
    currentChunk.push(`<p>${paragraphs[i]}</p>`); 
    currentLen += paragraphs[i].length;
    if (currentLen >= targetLen && chunks.length < numChunks - 1 && i < paragraphs.length - 1) {
      chunks.push(currentChunk.join('')); currentChunk = []; currentLen = 0;
    }
  }
  if (currentChunk.length > 0) chunks.push(currentChunk.join(''));
  while(chunks.length < numChunks) chunks.push('');
  return chunks;
}

function distributeTextAcrossColumns(paragraphs, startCol, template) {
  if (!paragraphs || paragraphs.length === 0) return { chunks: ['', '', ''], leadCol: -1 };
  
  let slots = [];
  if (template === 'diag-a' || template === 'diag-b') {
      slots = [{col: 1, pos: 1}, {col: 2, pos: 2}, {col: 3, pos: 3}];
  } else if (template === 'diag-c') {
      slots = [{col: 1, pos: 3}, {col: 2, pos: 1}, {col: 3, pos: 2}];
  } else if (template === 'diag-d') {
      slots = [{col: 1, pos: 2}, {col: 2, pos: 3}, {col: 3, pos: 1}];
  } else {
      slots = [{col: 1, pos: 1}, {col: 2, pos: 2}, {col: 3, pos: 3}];
  }
  
  let activeSlots = slots.filter(s => s.col >= startCol);
  activeSlots.sort((a, b) => a.pos - b.pos);
  
  let splitChunks = splitTextIntoChunks(paragraphs, activeSlots.length);
  let result = { 1: '', 2: '', 3: '' };
  activeSlots.forEach((slot, i) => { result[slot.col] = splitChunks[i]; });
  
  return { chunks: [result[1], result[2], result[3]], leadCol: activeSlots.length > 0 ? activeSlots[0].col : -1 };
}

function wrapP(paras) { 
  if (!paras || paras.length === 0) return '';
  return paras.map(p => `<p>${p}</p>`).join(''); 
}

function renderSubGrid(colAText, colBText, leadTarget = null) {
  if (!colAText && !colBText) return '';
  return `<div class="text-subgrid-2">
            <div class="col-text ${colAText ? '' : 'empty-spacer'} ${leadTarget === 'A' ? 'is-lead' : ''}">${colAText}</div>
            <div class="col-text ${colBText ? '' : 'empty-spacer'} ${leadTarget === 'B' ? 'is-lead' : ''}">${colBText}</div>
          </div>`;
}

function renderSingleCol(text, isLead = false) {
  if (!text) return '<div class="col-text empty-spacer"></div>';
  return `<div class="col-text ${isLead ? 'is-lead' : ''}">${text}</div>`;
}

function renderTextColumns(paragraphs, numCols) {
  if (!paragraphs || paragraphs.length === 0) return '';
  if (numCols === 1) return renderSingleCol(splitTextIntoChunks(paragraphs, 1)[0], true);
  if (numCols === 2) {
     const chunks = splitTextIntoChunks(paragraphs, 2);
     return renderSubGrid(chunks[0], chunks[1], 'A');
  }
  if (numCols === 3) {
     const chunks = splitTextIntoChunks(paragraphs, 3);
     return `<div class="text-subgrid-3">
                <div class="col-text is-lead">${chunks[0]}</div>
                <div class="col-text">${chunks[1]}</div>
                <div class="col-text">${chunks[2]}</div>
              </div>`;
  }
  return '';
}

function buildCarousel(images, tag) {
  if (!images || images.length === 0) return '';
  const isMulti = images.length > 1;
  const clickZones = isMulti ? `<div class="carousel-click-zone left"></div><div class="carousel-click-zone right"></div>` : '';
  const dots = isMulti ? `<div class="carousel-dots">${images.map((_, i) => `<div class="carousel-dot ${i===0 ? 'active':''}" data-index="${i}"></div>`).join('')}</div>` : '';
  const numTag = tag ? `<div class="carousel-tag">${tag}</div>` : '';
  const trackContent = images.map(img => `<div class="carousel-slide"><img class="media-embed" src="${img}" alt="" loading="lazy" decoding="async"></div>`).join('');
  return `<div class="carousel-track" data-index="0">${trackContent}</div>${clickZones}${dots}${numTag}`;
}

// Generates dynamic widths/margins to handle fractional columns seamlessly
function getGridPlacement(span, startCol) {
    let s = parseFloat(span) || 3;
    let c = parseFloat(startCol) || 1;
    
    if (Number.isInteger(s) && Number.isInteger(c)) {
        return `grid-column: ${c} / span ${s}; width: 100%;`;
    }
    let offsetCols = c - 1;
    let width = `calc(((100% - 2 * var(--gutter)) / 3) * ${s} + var(--gutter) * ${s - 1})`;
    let marginLeft = offsetCols > 0 ? `calc(((100% - 2 * var(--gutter)) / 3) * ${offsetCols} + var(--gutter) * ${offsetCols})` : '0px';
    
    return `grid-column: 1 / span 3; width: ${width}; margin-left: ${marginLeft};`;
}

function renderIndependentMedia(type, contentHTML, span, startCol, extTop, extBot) {
    let s = parseFloat(span) || 3;
    let c = parseFloat(startCol) || 1;
    let aspectClass = s === 3 ? 'aspect-panorama' : (s === 2 ? 'aspect-landscape' : 'aspect-portrait');
    if (type === 'video') aspectClass = 'aspect-video';
    
    let artMt = Math.max(0, extTop);
    let artMb = Math.max(0, extBot);
    let artStyle = ``;
    if (artMt > 0) artStyle += `margin-top: calc(var(--gutter) * ${artMt}); `;
    if (artMb > 0) artStyle += `margin-bottom: calc(var(--gutter) * ${artMb});`;
    
    let topOffset = extTop !== 0 ? `calc(var(--gutter) * ${-extTop})` : '0px';
    let botOffset = extBot !== 0 ? `calc(var(--gutter) * ${-extBot})` : '0px';

    return `
    <div class="content-grid-3" style="${artStyle}">
      <div style="${getGridPlacement(s, c)} display: flex; flex-direction: column;">
        <div class="${aspectClass}" style="position: relative; width: 100%;">
          <div class="visual-box chamfer-tl-br" style="position: absolute; left: 0; right: 0; top: ${topOffset}; bottom: ${botOffset}; overflow: hidden;">
            ${contentHTML}
          </div>
        </div>
      </div>
    </div>`;
}

const TEMPLATES = {
  renderBlock: function(block) {
    let html = '';
    const projAttr = block.primaryProject ? `data-project-id="${block.primaryProject}" class="project-block"` : `class="project-block"`;
    
    switch(block.type) {
      case 'kicker': html = `<div id="${block.id}" ${projAttr}><div class="block-kicker" style="text-wrap: balance;">${block.text}</div></div>`; break;
      case 'headline': html = `<div id="${block.id}" ${projAttr}><div class="block-headline" style="text-wrap: balance;">${block.text}</div></div>`; break;
      case 'typology': html = `<div id="${block.id}" ${projAttr}><div class="block-domain" style="text-wrap: balance;">${block.text}</div></div>`; break;
      case 'typology-standstill': html = `<div id="${block.id}" ${projAttr}><div class="block-domain-standstill" style="text-wrap: balance;">${block.text}</div></div>`; break;
        
      case 'independent-text': {
        let tSpan = parseFloat(block.span) || 2;
        let tStart = parseFloat(block.startCol) || 1;
        html = `
          <div id="${block.id}" ${projAttr} class="content-grid-3">
            <div style="${getGridPlacement(tSpan, tStart)} display: flex; flex-direction: column;">
              ${renderTextColumns(block.text, block.colCount)}
            </div>
          </div>`;
        break;
      }

      case 'independent-carousel': {
        let cExtTop = parseFloat(block.marginTop) || 0; 
        let cExtBot = parseFloat(block.marginBottom) || 0;
        let carouselHTML = buildCarousel(block.images, block.tag);
        html = `<div id="${block.id}" ${projAttr}>${renderIndependentMedia('image', carouselHTML, block.span, block.startCol, cExtTop, cExtBot)}</div>`;
        break;
      }

      case 'hero-image': {
        let imgHTML = `<img class="media-embed" src="${block.image}" alt="" loading="lazy" decoding="async">`;
        html = `<div id="${block.id}" ${projAttr}>${renderIndependentMedia('image', imgHTML, block.span, block.startCol, 0, 0)}</div>`;
        break;
      }

      case 'hero-video': {
        const mediaContent = block.embedCode ? block.embedCode : `<video class="media-embed" src="${block.videoUrl}" autoplay loop muted playsinline></video>`;
        html = `<div id="${block.id}" ${projAttr}>${renderIndependentMedia('video', mediaContent, block.span, block.startCol, 0, 0)}</div>`;
        break;
      }

      case 'visual-layout': html = this.renderLayout(block, projAttr); break;
    }

    const spacerVal = parseFloat(block.spacerBelow);
    const spacerHtml = (!isNaN(spacerVal) && spacerVal > 0) ? `<div style="height: calc(var(--gutter) * ${spacerVal}); width: 100%;"></div>` : '';
    return html + spacerHtml;
  },

  renderLayout: function(data, projAttr) {
    let layoutHTML = '';
    
    let eT1 = parseFloat(data.img1ExtTop) || 0; let eB1 = parseFloat(data.img1ExtBot) || 0;
    let eT2 = parseFloat(data.img2ExtTop) || 0; let eB2 = parseFloat(data.img2ExtBot) || 0;

    let articleMt = 0; let articleMb = 0;
    
    // Outer article wrapper ONLY receives positive margins to physically push adjacent blocks away.
    if (data.template === 'diag-a' || data.template === 'diag-b') { 
        articleMt = Math.max(0, eT2); 
        articleMb = Math.max(0, eB1); 
    } 
    else if (data.template === 'diag-c' || data.template === 'diag-d') { 
        articleMt = Math.max(0, eT1); 
        articleMb = Math.max(0, eB2); 
    } 
    else if (data.template === 'side-img-text' || data.template === 'side-img1-text1') { 
        articleMt = Math.max(0, eT1); 
        articleMb = Math.max(0, eB1); 
    }
    else if (data.template === 'side-text-img2' || data.template === 'side-text-img1') { 
        articleMt = Math.max(0, eT2); 
        articleMb = Math.max(0, eB2); 
    }
    
    let artWrapperStyle = `padding-top: 0;`;
    if(articleMt > 0) artWrapperStyle += ` margin-top: calc(var(--gutter) * ${articleMt});`;
    if(articleMb > 0) artWrapperStyle += ` margin-bottom: calc(var(--gutter) * ${articleMb});`;

    function img(imgData, imgTag, eT, eB) {
        // Negative values strictly shrink the image natively within the text's flex column.
        let mt = eT !== 0 ? `margin-top: calc(var(--gutter) * ${-eT});` : ``;
        let mb = eB !== 0 ? `margin-bottom: calc(var(--gutter) * ${-eB});` : ``;
        
        return `
        <div class="flex-stretch-wrapper" style="flex: 1 1 auto; display: flex; flex-direction: column; min-height: clamp(250px, 40vh, 500px); width: 100%; ${mt} ${mb}">
            <div class="visual-box chamfer-tl-br" style="flex: 1 1 auto; position: relative; overflow: hidden; width: 100%;">
                ${buildCarousel(imgData, imgTag)}
            </div>
        </div>`;
    }

    if (data.template.startsWith('diag-')) {
      let start = data.textStartCol || 1;
      const distribution = distributeTextAcrossColumns(data.text, start, data.template);
      const chunks = distribution.chunks;
      const lead = distribution.leadCol;
      
      if (data.template === 'diag-a') {
        let subGridLead = lead === 1 ? 'A' : (lead === 2 ? 'B' : null);
        let singleLead = lead === 3;
        layoutHTML = `
          <div class="content-grid-3">
            <div class="span-2" style="display: flex; flex-direction: column; gap: var(--gutter);">
              ${renderSubGrid(chunks[0], chunks[1], subGridLead)}
              ${img(data.img1Data, data.img1Tag, eT1, eB1)}
            </div>
            <div class="span-1 tablet-full" style="display: flex; flex-direction: column; gap: var(--gutter);">
              ${img(data.img2Data, data.img2Tag, eT2, eB2)}
              ${renderSingleCol(chunks[2], singleLead)}
            </div>
          </div>`;
      } 
      else if (data.template === 'diag-b') {
        let singleLead = lead === 1;
        let subGridLead = lead === 2 ? 'A' : (lead === 3 ? 'B' : null);
        layoutHTML = `
          <div class="content-grid-3">
            <div class="span-1 tablet-full" style="display: flex; flex-direction: column; gap: var(--gutter);">
              ${renderSingleCol(chunks[0], singleLead)}
              ${img(data.img1Data, data.img1Tag, eT1, eB1)}
            </div>
            <div class="span-2" style="display: flex; flex-direction: column; gap: var(--gutter);">
              ${img(data.img2Data, data.img2Tag, eT2, eB2)}
              ${renderSubGrid(chunks[1], chunks[2], subGridLead)}
            </div>
          </div>`;
      }
      else if (data.template === 'diag-c') {
        let singleLead = lead === 1;
        let subGridLead = lead === 2 ? 'A' : (lead === 3 ? 'B' : null);
        layoutHTML = `
          <div class="content-grid-3">
            <div class="span-1 tablet-full" style="display: flex; flex-direction: column; gap: var(--gutter);">
              ${img(data.img1Data, data.img1Tag, eT1, eB1)}
              ${renderSingleCol(chunks[0], singleLead)}
            </div>
            <div class="span-2" style="display: flex; flex-direction: column; gap: var(--gutter);">
              ${renderSubGrid(chunks[1], chunks[2], subGridLead)}
              ${img(data.img2Data, data.img2Tag, eT2, eB2)}
            </div>
          </div>`;
      }
      else if (data.template === 'diag-d') {
        let subGridLead = lead === 1 ? 'A' : (lead === 2 ? 'B' : null);
        let singleLead = lead === 3;
        layoutHTML = `
          <div class="content-grid-3">
            <div class="span-2" style="display: flex; flex-direction: column; gap: var(--gutter);">
              ${img(data.img1Data, data.img1Tag, eT1, eB1)}
              ${renderSubGrid(chunks[0], chunks[1], subGridLead)}
            </div>
            <div class="span-1 tablet-full" style="display: flex; flex-direction: column; gap: var(--gutter);">
              ${renderSingleCol(chunks[2], singleLead)}
              ${img(data.img2Data, data.img2Tag, eT2, eB2)}
            </div>
          </div>`;
      }
    }

    else if (data.template === 'side-img-text') {
      const chunks = splitTextIntoChunks(data.text, 2);
      layoutHTML = `
        <div class="content-grid-3">
          <div class="span-1 tablet-full" style="display: flex; flex-direction: column;">
            ${img(data.img1Data, data.img1Tag, eT1, eB1)}
          </div>
          <div class="span-2" style="display: flex; flex-direction: column;">
            ${renderSubGrid(chunks[0], chunks[1], 'A')}
          </div>
        </div>`;
    }
    else if (data.template === 'side-img1-text1') {
      layoutHTML = `
        <div class="content-grid-3">
          <div class="span-1" style="display: flex; flex-direction: column;">
            ${img(data.img1Data, data.img1Tag, eT1, eB1)}
          </div>
          <div class="span-1" style="display: flex; flex-direction: column;">
            <div class="col-text is-lead">${wrapP(data.text)}</div>
          </div>
        </div>`;
    }
    else if (data.template === 'side-text-img1') {
      layoutHTML = `
        <div class="content-grid-3">
          <div class="span-1" style="display: flex; flex-direction: column;">
            <div class="col-text is-lead">${wrapP(data.text)}</div>
          </div>
          <div class="span-1" style="display: flex; flex-direction: column;">
            ${img(data.img2Data, data.img2Tag, eT2, eB2)}
          </div>
        </div>`;
    }
    else if (data.template === 'side-text-img2') {
      layoutHTML = `
        <div class="content-grid-3">
          <div class="span-1 tablet-full" style="display: flex; flex-direction: column;">
            <div class="col-text is-lead">${wrapP(data.text)}</div>
          </div>
          <div class="span-2" style="display: flex; flex-direction: column;">
            ${img(data.img2Data, data.img2Tag, eT2, eB2)}
          </div>
        </div>`;
    }

    return `<article id="${data.id}" ${projAttr} class="page-spread" style="${artWrapperStyle}">${layoutHTML}</article>`;
  }
};