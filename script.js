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

// Image preprocessing for handwriting recognition
document.getElementById('uploadImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    const imagePreview = document.getElementById('handwritingPreview');
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

            // Convert to grayscale
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i + 1] = data[i + 2] = avg;
            }
            ctx.putImageData(imageData, 0, 0);

            imagePreview.src = canvas.toDataURL();
            imagePreview.style.display = "block";
            writingFeedbackText.textContent = "جارٍ تحليل الخط...";

            Tesseract.recognize(canvas.toDataURL(), 'ara', {
                logger: function (m) { console.log(m); }
            }).then(function (result) {
                const recognizedText = result.data.text;
                writingFeedbackText.textContent = "النص المكتوب: " + recognizedText;

                const incorrectWords = savedWords.filter(word => !recognizedText.includes(word));
                if (incorrectWords.length === 0) {
                    writingFeedbackText.textContent += "\nخطك واضح! كتبت جميع الكلمات بشكل صحيح.";
                } else {
                    writingFeedbackText.textContent += "\nالكلمات التالية تحتاج إلى تحسين: \n" + analyzeHandwriting(recognizedText, incorrectWords);
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

// Function to analyze handwriting
function analyzeHandwriting(recognizedText, words) {
    let feedback = "";
    const writingIcons = document.getElementById('writingIcons');
    writingIcons.innerHTML = '';

    let correctCount = 0;

    words.forEach(word => {
        if (!recognizedText.includes(word)) {
            feedback += `كلمة "${word}" غير واضحة. تأكد من كتابة جميع الحروف بشكل واضح ومتصل.\n`;
            addFeedbackIcon(writingIcons, '❌', 'incorrect-icon');
        } else {
            correctCount++;
            addFeedbackIcon(writingIcons, '✅', 'correct-icon');
        }
    });

    const progressPercentage = (correctCount / words.length) * 100;
    document.getElementById('writingProgressBar').style.width = progressPercentage + '%';

    return feedback;
}
