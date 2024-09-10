let savedWords = [];

// Save teacher's words
document.getElementById('saveWords').addEventListener('click', function() {
    const teacherInput = document.getElementById('teacherWords').value;
    savedWords = teacherInput.split('\n').map(word => word.trim()).filter(word => word !== "");
    document.getElementById('savedWords').textContent = savedWords.join(', ');
    document.getElementById('savedWordsDisplay').style.display = 'block';
    alert('تم حفظ الكلمات!');
});

// Function to give detailed pronunciation feedback with icons
function analyzePronunciation(transcript, words) {
    let feedback = "";
    const readingIcons = document.getElementById('readingIcons');
    readingIcons.innerHTML = ''; // Clear previous icons

    let correctCount = 0;

    words.forEach(word => {
        if (!transcript.includes(word)) {
            feedback += `كلمة "${word}" غير صحيحة. تأكد من نطق جميع الحروف بوضوح.\n`;
            addFeedbackIcon(readingIcons, '❌', 'incorrect-icon');
        } else {
            correctCount++;
            addFeedbackIcon(readingIcons, '✅', 'correct-icon');
        }
    });

    const progressPercentage = (correctCount / words.length) * 100;
    document.getElementById('readingProgressBar').style.width = progressPercentage + '%';

    return feedback;
}

// Function to add feedback icons (correct/incorrect)
function addFeedbackIcon(container, symbol, className) {
    const icon = document.createElement('span');
    icon.textContent = symbol;
    icon.classList.add('feedback-icon', className);
    container.appendChild(icon);
}

// Speech recognition setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';
recognition.interimResults = true;

document.getElementById('startReading').addEventListener('click', function () {
    let readingFeedbackText = document.getElementById('readingFeedbackText');
    readingFeedbackText.textContent = "التحليل جارٍ... من فضلك ابدأ القراءة بصوت عالٍ.";

    recognition.start();

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        readingFeedbackText.textContent = "النص الذي قرأته: " + transcript;

        const incorrectWords = savedWords.filter(word => !transcript.includes(word));
        if (incorrectWords.length === 0) {
            readingFeedbackText.textContent += "\nأداء جيد! قرأت جميع الكلمات بشكل صحيح.";
        } else {
            readingFeedbackText.textContent += "\nالكلمات التالية تحتاج إلى تحسين: \n" + analyzePronunciation(transcript, incorrectWords);
        }
    };

    recognition.onerror = function (event) {
        readingFeedbackText.textContent = "حدث خطأ: " + event.error;
    };
});

// Image preprocessing for handwriting recognition with enhanced data augmentation
document.getElementById('uploadImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const writingFeedbackText = document.getElementById('writingFeedbackText');

    reader.onload = function () {
        const img = new Image();
        img.src = reader.result;
        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image onto canvas
            ctx.drawImage(img, 0, 0);

            // Apply enhanced Data Augmentation
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            imageData = applyDataAugmentation(imageData); // Aggressive data augmentation

            // Grayscale conversion
            imageData = convertToGrayscale(imageData);

            // Apply Gaussian Blur for noise reduction
            const blurredImage = applyGaussianBlur(ctx, imageData);
            ctx.putImageData(blurredImage, 0, 0);

            // Apply Adaptive Thresholding for binarization
            const thresholdedData = applyAdaptiveThresholding(blurredImage);
            ctx.putImageData(thresholdedData, 0, 0);

            // Recognizing the text using Tesseract.js
            Tesseract.recognize(canvas.toDataURL(), 'ara', {
                tessedit_char_whitelist: 'ابتثجحخدذرزسشصضطظعغفقكلمنهويأإآؤءئةًٌٍَُِّْ',
                psm: 7,  // Using single line of text segmentation mode
                logger: function (m) { console.log(m); }
            }).then(function (result) {
                const recognizedText = result.data.text;
                writingFeedbackText.textContent = "النص المكتوب: " + recognizedText;

                const incorrectWords = savedWords.filter(word => !recognizedText.includes(word));
                if (incorrectWords.length === 0) {
                    writingFeedbackText.textContent += "\nخطك واضح! كتبت جميع الكلمات بشكل صحيح.";
                } else {
                    writingFeedbackText.textContent += "\nالكلمات التالية تحتاج إلى تحسين: \n" + analyzeHandwriting(recognizedText, incorrectWords);
                    incorrectWords.forEach(word => drawTraceLetter(word));
                }
            }).catch(function (error) {
                writingFeedbackText.textContent = "حدث خطأ أثناء التعرف على الكتابة: " + error.message;
            });
        };
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});

// Enhanced Data Augmentation: Adds rotation, scaling, shearing, and more noise
function applyDataAugmentation(imageData) {
    const ctx = canvas.getContext('2d');

    // Randomly rotate between -20 to +20 degrees
    const rotationAngle = (Math.random() - 0.5) * 0.7;  // ±20 degrees
    ctx.rotate(rotationAngle);

    // Apply more aggressive scaling
    const scaleFactor = 1 + (Math.random() - 0.5) * 0.3;  // ±30% scaling
    ctx.scale(scaleFactor, scaleFactor);

    // Apply shearing
    const shearFactorX = (Math.random() - 0.5) * 0.2;  // ±20% shear
    const shearFactorY = (Math.random() - 0.5) * 0.2;  // ±20% shear
    ctx.transform(1, shearFactorY, shearFactorX, 1, 0, 0);

    // Add realistic noise
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 40;  // ±40 for realistic noise
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
    }
    return imageData;
}

// Convert image to grayscale
function convertToGrayscale(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
    }
    return imageData;
}

// Gaussian Blur for noise reduction
function applyGaussianBlur(ctx, imageData) {
    const kernel = [1/16, 1/8, 1/16, 1/8, 1/4, 1/8, 1/16, 1/8, 1/16];
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let pixelIndex = (y * width + x) * 4;
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const i = ((y + ky) * width + (x + kx)) * 4;
                    sum += data[i] * kernel[(ky + 1) * 3 + (kx + 1)];
                }
            }
            data[pixelIndex] = data[pixelIndex + 1] = data[pixelIndex + 2] = sum;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return imageData;
}

// Adaptive Thresholding for better binarization
function applyAdaptiveThresholding(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * 4;
            const brightness = data[pixelIndex];
            const localMean = getLocalMean(data, width, height, x, y, 3);
            const threshold = localMean - 5;
            data[pixelIndex] = data[pixelIndex + 1] = data[pixelIndex + 2] = brightness > threshold ? 255 : 0;
        }
    }
    return imageData;
}

// Function to calculate local mean in a 3x3 neighborhood
function getLocalMean(data, width, height, x, y, neighborhoodSize) {
    let sum = 0;
    let count = 0;
    const offset = Math.floor(neighborhoodSize / 2);

    for (let dy = -offset; dy <= offset; dy++) {
        for (let dx = -offset; dx <= offset; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const index = (ny * width + nx) * 4;
                sum += data[index];
                count++;
            }
        }
    }
    return sum / count;
}

// Function to analyze handwriting
function analyzeHandwriting(recognizedText, words) {
    let feedback = "";
    const writingIcons = document.getElementById('writingIcons');
    writingIcons.innerHTML = '';

    let correctCount = 0;

    words.forEach(word => {
        let wordCorrect = true;
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (!recognizedText.includes(char)) {
                feedback += `الحرف "${char}" في كلمة "${word}" غير واضح.\n`;
                addFeedbackIcon(writingIcons, '❌', 'incorrect-icon');
                wordCorrect = false;
                break;
            }
        }
        if (wordCorrect) {
            correctCount++;
            addFeedbackIcon(writingIcons, '✅', 'correct-icon');
        }
    });

    const progressPercentage = (correctCount / words.length) * 100;
    document.getElementById('writingProgressBar').style.width = progressPercentage + '%';

    return feedback;
}

// Function to draw traceable letters
function drawTraceLetter(letter) {
    const traceCanvas = document.getElementById('letterTraceCanvas');
    traceCanvas.style.display = "block";
    const ctx = traceCanvas.getContext('2d');
    traceCanvas.width = 100;
    traceCanvas.height = 100;
    ctx.clearRect(0, 0, traceCanvas.width, traceCanvas.height);
    ctx.font = '60px Tajawal';
    ctx.strokeText(letter, 10, 60); // Display the letter to trace
}
