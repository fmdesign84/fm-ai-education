// FM AI Education — Gemini API 이미지 생성 스크립트
// 사용법: GEMINI_API_KEY=your_key node generate-images.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY 환경변수를 설정해주세요.');
  console.error('사용법: GEMINI_API_KEY=your_key node generate-images.js');
  process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, 'assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// 슬라이드 배경색 기준:
// hero: 오렌지 그라디언트 (#FF4500 → #FF8F64)
// light: 흰색 (#FFFFFF)
// warm: 베이지 (#F5F0EB)
// dark: #121212
// color-purple: 퍼플 (#AB9BFF)
const IMAGE_PROMPTS = [
  // === 마스코트 석상 (패러디) ===
  {
    filename: 'mascot-thinker.png',
    prompt: 'A cute, stylized miniature version of Rodin\'s "The Thinker" marble sculpture wearing a modern black business suit and thick-rimmed glasses. The sculpture is in a thinking pose with one hand on chin. Clean transparent/white background (#F5F0EB). The statue has a warm cream marble tone. Friendly, approachable, slightly humorous. Square 1:1 format. Studio lighting. Very clean edges for cutout. No text. Ultra high quality.',
  },
  // === hero 슬라이드 배경 (오렌지 그라디언트 위) ===
  {
    filename: 'bg-hero.jpg',
    prompt: 'A dramatic classical Greek marble bust sculpture, slightly off-center to the right, on a warm orange gradient background (#FF4500 to #FF8F64). The bust has a heroic, forward-looking pose. Warm orange and gold lighting illuminates the sculpture from the side. The mood is bold, powerful, and premium. Cinematic composition with generous negative space on the left for text overlay. Very high contrast. No text, no logos. 16:9 aspect ratio. Ultra high quality. Fashion editorial meets museum photography aesthetic.',
  },
  // === light 슬라이드 배경 (흰색 위) ===
  {
    filename: 'bg-light.jpg',
    prompt: 'A minimal classical Greek marble hand sculpture fragment, positioned in the lower-right corner, on pure white (#FFFFFF) background. The marble has clean white and very light gray tones. Extremely subtle soft shadows. The mood is elegant and airy. Museum white gallery photography aesthetic. Generous white space for text. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
  // === warm 슬라이드 배경 (베이지 위) ===
  {
    filename: 'bg-warm.jpg',
    prompt: 'A fragment of a classical Greek marble torso sculpture, positioned off-center, on warm beige (#F5F0EB) background. The marble tones blend with the warm beige — cream, ivory, light sand colors. Soft natural lighting from above. Serene, contemplative mood. Museum gallery with warm lighting. Generous negative space. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
  // === dark 슬라이드 배경 (#121212 위) ===
  {
    filename: 'bg-dark.jpg',
    prompt: 'A dramatic classical Greek marble bust sculpture on very dark background (#121212 to #1A1A1A). The bust is positioned to the left, with dramatic side lighting in warm orange (#FF6B00) creating strong contrast between light and deep shadow. Only one side of the face is illuminated. Cinematic, moody, premium. Like a luxury fashion brand campaign shot in a dark museum. Generous dark space on the right. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
  // === quad-card 아이콘 이미지 (카드 내부, 라이트 배경) ===
  {
    filename: 'ai-text.jpg',
    prompt: 'Minimal 3D illustration: a floating text document page with subtle sparkle particles around it. Background is light warm gray (#F5F5F7), seamlessly blending. Single orange (#FF6B00) accent highlight on one line. Clean, soft shadows, Apple product page style. No text on the image. Square 1:1 format. Ultra high quality.',
  },
  {
    filename: 'ai-image.jpg',
    prompt: 'Minimal 3D illustration: an image canvas or photo frame floating at a slight angle, with colorful abstract shapes emerging from it. Background is light warm gray (#F5F5F7), seamless. Single orange (#FF6B00) accent element. Soft shadows, Apple product page style. No text. Square 1:1 format. Ultra high quality.',
  },
  {
    filename: 'ai-video.jpg',
    prompt: 'Minimal 3D illustration: a rounded play button with subtle motion blur trails behind it. Background is light warm gray (#F5F5F7), seamless. Single orange (#FF6B00) play triangle accent. Soft shadows, Apple product page style. No text. Square 1:1 format. Ultra high quality.',
  },
  {
    filename: 'ai-code.jpg',
    prompt: 'Minimal 3D illustration: a terminal or code editor window floating at a slight angle, with curly braces { } visible. Background is light warm gray (#F5F5F7), seamless. Single orange (#FF6B00) cursor or accent line. Soft shadows, Apple product page style. No text content. Square 1:1 format. Ultra high quality.',
  },
  // === paradigm-card 이미지 ===
  {
    filename: 'paradigm-old.jpg',
    prompt: 'Minimal flat illustration: traditional desktop workspace with a monitor showing a complex software interface (like Photoshop toolbar layout), plus a spreadsheet icon and a Word document icon arranged neatly. Background is light warm gray (#F5F5F7), seamless. Muted gray and blue tones, slightly desaturated. Clean vector-like style. No text. 16:10 aspect ratio.',
  },
  {
    filename: 'paradigm-new.jpg',
    prompt: 'Very simple, minimal flat illustration: a single chat bubble icon and a small sparkle symbol on very light warm orange tint (#FFF5F0) background, seamless. Only two or three simple geometric shapes. Warm orange (#FF6B00) accent. Extremely clean, airy, lots of white space. No text. 16:10 aspect ratio.',
  },
  // === 코드 시연 슬라이드 이미지 (dark 배경) ===
  {
    filename: 'screenshot-code.jpg',
    prompt: 'Realistic screenshot of a modern dark terminal or code editor window. Dark background (#1A1A2E). Monospace font showing a coding assistant CLI conversation. User input line with a prompt symbol (>) followed by Korean-like text characters. Below it, the AI response shows colorful syntax-highlighted code (HTML/CSS) with orange, green, purple highlights. The terminal has a sleek title bar. Professional developer workspace aesthetic. No real readable text needed — just suggest the visual pattern of a terminal conversation. 16:9 aspect ratio. Ultra high quality.',
  },
  // === 커버/특수 이미지 ===
  {
    filename: 'cover-day1.jpg',
    prompt: 'Full classical Greek marble statue (like David or Apollo), centered, on warm orange gradient background (#FF4500 to #FF8F64). The statue looks upward with an inspiring, visionary pose. Dramatic warm orange side lighting. Premium, powerful, modern museum meets fashion editorial. Bold composition. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
  {
    filename: 'cover-day2.jpg',
    prompt: 'Classical Greek marble bust with modern geometric overlay elements (thin orange lines), on warm orange gradient background (#FF4500 to #FF8F64). The bust faces slightly to the right. Blend of classical and futuristic. Dramatic lighting. Premium art direction. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
  {
    filename: 'break.jpg',
    prompt: 'Bright, airy coffee scene on warm beige (#F5F0EB) background. A single ceramic cup with gentle warm steam, softly lit with natural daylight. Very shallow depth of field. Clean, minimal, premium mood like Apple lifestyle photography. No text. 16:9 aspect ratio. Ultra high quality.',
  },
  {
    filename: 'closing.jpg',
    prompt: 'Two classical Greek marble hands reaching toward each other (like Michelangelo Creation of Adam composition) on warm orange gradient background (#FF4500 to #FF8F64). Warm golden orange lighting. Symbolizes human-AI connection. Dramatic, cinematic, premium. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
];

// Gemini API 호출
async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`;

  const body = JSON.stringify({
    contents: [{
      parts: [{
        text: `Generate an image based on this description. Output ONLY the image, no text response.\n\n${prompt}`
      }]
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Gemini 이미지 응답에서 base64 이미지 추출
          const parts = json.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData) {
              resolve(Buffer.from(part.inlineData.data, 'base64'));
              return;
            }
          }
          console.error('이미지 데이터 없음:', JSON.stringify(json).substring(0, 500));
          reject(new Error('이미지 데이터를 찾을 수 없습니다'));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`${IMAGE_PROMPTS.length}개 이미지 생성 시작...\n`);

  for (let i = 0; i < IMAGE_PROMPTS.length; i++) {
    const { filename, prompt } = IMAGE_PROMPTS[i];
    const filepath = path.join(ASSETS_DIR, filename);

    // 이미 존재하면 스킵
    if (fs.existsSync(filepath)) {
      console.log(`[${i + 1}/${IMAGE_PROMPTS.length}] ${filename} — 이미 존재, 스킵`);
      continue;
    }

    console.log(`[${i + 1}/${IMAGE_PROMPTS.length}] ${filename} 생성 중...`);

    try {
      const imageBuffer = await generateImage(prompt);
      fs.writeFileSync(filepath, imageBuffer);
      console.log(`  ✓ 저장 완료 (${(imageBuffer.length / 1024).toFixed(0)}KB)`);
    } catch (err) {
      console.error(`  ✗ 실패: ${err.message}`);
    }

    // API rate limit 방지
    if (i < IMAGE_PROMPTS.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log('\n완료!');
}

main();
