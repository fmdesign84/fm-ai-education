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

// 생성할 이미지 목록 — 배경색 매칭 필수
// 다크 슬라이드(#000000): cover-day1, cover-day2, break, closing
// 라이트 슬라이드: quad-card(#F5F5F7 카드 안), paradigm-card(#F5F5F7/#FFF5F0 카드 안)
const IMAGE_PROMPTS = [
  // === 화이트 배경 슬라이드 (배경: #FFFFFF) — 표지, Break ===
  {
    filename: 'cover-day1.jpg',
    prompt: 'Abstract minimal visualization of neural network connections. Pure white (#FFFFFF) background. Very subtle, thin orange (#FF6B00) light trails forming a sparse geometric network pattern. The lines are delicate and airy. Extremely clean, premium, Apple product page aesthetic. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
  {
    filename: 'cover-day2.jpg',
    prompt: 'Minimal abstract scene: a soft warm orange (#FF6B00) glowing orb floating in pure white (#FFFFFF) space. Subtle light rays emanating outward. The mood is focused and forward-looking. Premium, airy, Apple product page style. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
  {
    filename: 'break.jpg',
    prompt: 'Bright, airy coffee scene on pure white (#FFFFFF) background. A single ceramic cup with gentle warm steam, softly lit with natural daylight. Very shallow depth of field. Clean, minimal, premium mood like Apple lifestyle photography. No text. 16:9 aspect ratio. Ultra high quality.',
  },
  // === 화이트 배경 — 마무리 ===
  {
    filename: 'closing.jpg',
    prompt: 'Two abstract soft light sources merging on pure white (#FFFFFF) background — one warm orange (#FF6B00) and one light gray. They blend gently in the center, creating a subtle warm gradient. Symbolizes human-AI collaboration. Extremely minimal, airy, premium. Apple product page feel. No text, no logos. 16:9 aspect ratio. Ultra high quality.',
  },
  // === 라이트 배경 슬라이드 — quad-card 내부 (카드 배경: #F5F5F7) ===
  {
    filename: 'ai-text.jpg',
    prompt: 'Minimal 3D illustration: a floating text document page with subtle sparkle particles around it. Background is light warm gray (#F5F5F7), seamlessly blending with the background. Single orange (#FF6B00) accent highlight on one line. Clean, soft shadows, Apple product page style. No text on the image. Square 1:1 format. Ultra high quality.',
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
  // === 라이트 배경 — paradigm-card 내부 ===
  {
    filename: 'paradigm-old.jpg',
    prompt: 'Minimal flat illustration: traditional desktop workspace with a monitor showing a complex software interface (like Photoshop toolbar layout), plus a spreadsheet icon and a Word document icon arranged neatly. Background is light warm gray (#F5F5F7), seamless. Muted gray and blue tones, slightly desaturated. Clean vector-like style. No text. 16:10 aspect ratio.',
  },
  {
    filename: 'paradigm-new.jpg',
    prompt: 'Very simple, minimal flat illustration: a single chat bubble icon and a small sparkle symbol on very light warm orange tint (#FFF5F0) background, seamless. Only two or three simple geometric shapes. Warm orange (#FF6B00) accent. Extremely clean, airy, lots of white space. No text. 16:10 aspect ratio.',
  },
];

// Gemini API 호출
async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`;

  const body = JSON.stringify({
    contents: [{
      parts: [{
        text: `Generate an image based on this description. Output ONLY the image, no text response.\n\n${prompt}`
      }]
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      responseMimeType: 'application/json',
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
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n완료!');
}

main();
