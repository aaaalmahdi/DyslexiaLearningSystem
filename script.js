let savedWords = [];

// Save teacher's words
document.getElementById('saveWords').addEventListener('click', function() {
    const teacherInput = document.getElementById('teacherWords').value;
    savedWords = teacherInput.split('\n').map(word => word.trim()).filter(word => word !== "");
    document.getElementById('savedWords').textContent = savedWords.join(', ');
    document.getElementById('savedWordsDisplay').style.display = 'block';
    alert('تم حفظ الكلمات!');
});

// Function to give detailed pronunciation feedback
function analyzePronunciation(transcript, words) {
    let feedback = "";

    words.forEach(word => {
        if (!transcript.includes(word)) {
            // Basic guidance for common mispronunciations
            if (word.includes("غ")) {
                feedback += `حرف "غ" غير واضح في كلمة "${word}". حاول إخراج الصوت من الحلق بشكل أقوى.\n`;
            } else if (word.includes("ق")) {
                feedback += `حرف "ق" في كلمة "${word}" غير مضبوط. حاول نطقه من مؤخرة الحلق مع قليل من الصوت.\n`;
            } else if (word.includes("ث")) {
                feedback += `حرف "ث" في كلمة "${word}" يحتاج إلى تحسين. حاول إخراجه بوضوح بين الأسنان الأمامية.\n`;
            } else if (word.includes("ظ") || word.includes("ذ")) {
                feedback += `حرف "ظ" أو "ذ" غير صحيح في كلمة "${word}". حاول نطقها بإخراج طرف اللسان قليلاً.\n`;
            } else {
                feedback += `كلمة "${word}" غير صحيحة. تأكد من نطق جميع الحروف بوضوح.\n`;
            }
        }
    });

    return feedback;
}

// Initialize speech recognition for Arabic
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';  // Arabic language code
recognition.interimResults = false;  // We only want final results

document.getElementById('startReading').addEventListener('click', function () {
    let readingFeedback = document.getElementById('readingFeedback');
    readingFeedback.textContent = "التحليل جارٍ... من فضلك ابدأ القراءة بصوت عالٍ.";

    recognition.start();  // Start speech recognition

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;  // Get the transcription
        readingFeedback.textContent = "النص الذي قرأته: " + transcript;

        // Compare the transcript with the saved words
        const incorrectWords = savedWords.filter(word => !transcript.includes(word));
        if (incorrectWords.length === 0) {
            readingFeedback.textContent += "\nأداء جيد! قرأت جميع الكلمات بشكل صحيح.";
        } else {
            // Provide detailed feedback for incorrect words
            readingFeedback.textContent += "\nالكلمات التالية تحتاج إلى تحسين: \n" + analyzePronunciation(transcript, incorrectWords);
        }
    };

    recognition.onerror = function (event) {
        readingFeedback.textContent = "حدث خطأ: " + event.error;
    };
});

// Function to give detailed handwriting feedback
function analyzeHandwriting(recognizedText, words) {
    let feedback = "";

    words.forEach(word => {
        if (!recognizedText.includes(word)) {
            // Give guidance for common handwriting mistakes
            if (word.includes("ق") && recognizedText.includes("ك")) {
                feedback += `يبدو أن حرف "ق" تم كتابته كـ "ك" في كلمة "${word}". تأكد من أن خطاف القاف واضح.\n`;
            } else if (word.includes("ذ") && recognizedText.includes("د")) {
                feedback += `حرف "ذ" غير واضح في كلمة "${word}". يبدو أنك كتبت "د" بدلاً من "ذ". تأكد من كتابة النقطة فوق الدال.\n`;
            } else if (word.includes("ص") && recognizedText.includes("س")) {
                feedback += `حرف "ص" في كلمة "${word}" غير واضح ويبدو كـ "س". تأكد من إغلاق الحلقة في حرف الصاد.\n`;
            } else {
                feedback += `كلمة "${word}" غير واضحة. تأكد من كتابة جميع الحروف بشكل واضح ومتصل.\n`;
            }
        }
    });

    return feedback;
}

// Handle image upload and use OCR for handwriting recognition
document.getElementById('uploadImage').addEventListener('change', function (event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    let imagePreview = document.getElementById('handwritingPreview');
    let writingFeedback = document.getElementById('writingFeedback');

    reader.onload = function () {
        imagePreview.src = reader.result;
        imagePreview.style.display = "block";

        // Use Tesseract.js to recognize Arabic handwriting
        writingFeedback.textContent = "جارٍ تحليل الخط...";
        
        Tesseract.recognize(
            reader.result,
            'ara',  // Arabic language code
            {
                logger: function (m) { console.log(m); }  // Log progress in the console
            }
        ).then(function (result) {
            const recognizedText = result.data.text;
            writingFeedback.textContent = "النص المكتوب: " + recognizedText;

            // Compare recognized text with the saved words
            const incorrectWords = savedWords.filter(word => !recognizedText.includes(word));
            if (incorrectWords.length === 0) {
                writingFeedback.textContent += "\nخطك واضح! كتبت جميع الكلمات بشكل صحيح.";
            } else {
                // Provide detailed feedback for incorrect words
                writingFeedback.textContent += "\nالكلمات التالية تحتاج إلى تحسين: \n" + analyzeHandwriting(recognizedText, incorrectWords);
            }
        }).catch(function (error) {
            writingFeedback.textContent = "حدث خطأ أثناء التعرف على الكتابة: " + error.message;
        });
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});
