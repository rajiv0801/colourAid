document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active', 'hidden'));

            // Hide all sections
            sections.forEach(s => s.classList.add('hidden'));

            // Set current as active
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('active');
            }
        });
    });

    // --- Test State Management ---
    const stepStart = document.getElementById('step-start');
    const stepIshihara = document.getElementById('step-ishihara');
    const stepD15 = document.getElementById('step-d15');
    const stepResults = document.getElementById('step-results');
    
    const showStep = (stepElement) => {
        [stepStart, stepIshihara, stepD15, stepResults].forEach(el => el.classList.add('hidden'));
        stepElement.classList.remove('hidden');
    };

    // --- Ishihara Screening Logic ---
    const ishiharaPlates = [
        { number: 12, src: 'assets/plate_1.png' }, // Control plate
        { number: 8, src: 'assets/plate_2.png' },  // Mock red-green
        { number: 6, src: 'assets/plate_3.png' }   // Mock blue-yellow
    ];
    let currentPlateIndex = 0;
    let ishiharaScore = 0;
    let ishiharaAnswers = {};

    const plateNumberEl = document.getElementById('plate-number');
    const plateEl = document.getElementById('ishihara-plate');
    const ishiharaNumberEl = document.getElementById('ishihara-number');
    const ishiharaInput = document.getElementById('ishihara-input');
    const nextPlateBtn = document.getElementById('next-plate-btn');
    const skipPlateBtn = document.getElementById('skip-ishihara-btn');

    document.getElementById('start-test-btn').addEventListener('click', () => {
        currentPlateIndex = 0;
        ishiharaScore = 0;
        ishiharaAnswers = {};
        loadIshiharaPlate();
        showStep(stepIshihara);
    });

    const loadIshiharaPlate = () => {
        const plate = ishiharaPlates[currentPlateIndex];
        plateNumberEl.textContent = currentPlateIndex + 1;
        
        // Clear previous content
        plateEl.innerHTML = '';
        plateEl.style.background = 'transparent';
        
        const img = document.createElement('img');
        img.src = plate.src;
        img.alt = 'Ishihara Plate';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        
        plateEl.appendChild(img);
        
        ishiharaInput.value = '';
        ishiharaInput.focus();
    };

    const processIshiharaAnswer = (value) => {
        const expected = ishiharaPlates[currentPlateIndex].number;
        ishiharaAnswers[`plate${currentPlateIndex + 1}`] = value;
        if (parseInt(value) === expected) {
            ishiharaScore++;
        }
        
        currentPlateIndex++;
        if (currentPlateIndex < ishiharaPlates.length) {
            loadIshiharaPlate();
        } else {
            finishIshiharaScreening();
        }
    };

    nextPlateBtn.addEventListener('click', () => {
        if (ishiharaInput.value.trim() !== '') {
            processIshiharaAnswer(ishiharaInput.value);
        }
    });

    skipPlateBtn.addEventListener('click', () => {
        processIshiharaAnswer('none');
    });
    
    ishiharaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && ishiharaInput.value.trim() !== '') {
            processIshiharaAnswer(ishiharaInput.value);
        }
    });

    const finishIshiharaScreening = () => {
        // If they get everything correct, they pass the screening
        if (ishiharaScore === ishiharaPlates.length) {
            showFinalResults(
                "Normal Color Vision", 
                "none", 
                0, 
                "Good work! You passed the screening test perfectly. Your color vision appears to be normal."
            );
        } else {
            // Failed screening, launch D-15 arrangement test
            initD15Test();
            showStep(stepD15);
        }
    };

    // --- Farnsworth D-15 Test Logic ---
    // Authentic Munsell Colors roughly translated to HEX for D-15
    // Format: id: Position, hex: Color
    const d15Colors = [
        { id: 1, hex: '#4B889F' }, // Munsell 5B 5/8
        { id: 2, hex: '#488D8E' }, // Munsell 5BG 5/8
        { id: 3, hex: '#4B9075' }, // Munsell 5G 5/8
        { id: 4, hex: '#6D9053' }, // Munsell 5GY 5/8
        { id: 5, hex: '#948B3F' }, // Munsell 5Y 5/8
        { id: 6, hex: '#B28247' }, // Munsell 5YR 5/8
        { id: 7, hex: '#C27658' }, // Munsell 5R 5/8
        { id: 8, hex: '#C66974' }, // Munsell 5RP 5/8
        { id: 9, hex: '#BB5F98' }, // Munsell 5P 5/8
        { id: 10, hex: '#9C62B4' }, // Munsell 5PB 5/8
        { id: 11, hex: '#776DC0' }, // Munsell 5B 4/8
        { id: 12, hex: '#587AC7' }, // Munsell 5BG 4/8
        { id: 13, hex: '#4485BE' }, // Munsell 5G 4/8
        { id: 14, hex: '#3E8BAA' }, // Munsell 5GY 4/8
        { id: 15, hex: '#418B99' }  // Munsell 5Y 4/8
    ];

    const sortableCapsContainer = document.getElementById('sortable-caps');
    const evaluateBtn = document.getElementById('evaluate-test-btn');
    let draggedCap = null;

    const initD15Test = () => {
        sortableCapsContainer.innerHTML = '';
        // Reference Cap is 5B 5/8 or a specific Pilot blue
        const refCapHex = '#1c7cab'; // Pilot cap
        document.getElementById('ref-cap').style.backgroundColor = refCapHex;

        // Shuffle colors
        const shuffled = [...d15Colors].sort(() => Math.random() - 0.5);

        shuffled.forEach(color => {
            const cap = document.createElement('div');
            cap.className = 'cap sortable-cap';
            cap.style.backgroundColor = color.hex;
            cap.dataset.id = color.id;
            cap.draggable = true;

            // Drag events
            cap.addEventListener('dragstart', handleDragStart);
            cap.addEventListener('dragend', handleDragEnd);

            sortableCapsContainer.appendChild(cap);
        });
    };

    // Drag and Drop Logic
    function handleDragStart() {
        draggedCap = this;
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        draggedCap = null;
    }

    sortableCapsContainer.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(sortableCapsContainer, e.clientX);
        const currentDraggable = document.querySelector('.dragging');
        if (afterElement == null) {
            sortableCapsContainer.appendChild(currentDraggable);
        } else {
            sortableCapsContainer.insertBefore(currentDraggable, afterElement);
        }
    });

    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.sortable-cap:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Evaluation Logic
    evaluateBtn.addEventListener('click', () => {
        const currentCaps = [...sortableCapsContainer.querySelectorAll('.sortable-cap')];
        const userOrder = [0, ...currentCaps.map(c => parseInt(c.dataset.id))]; // 0 is reference
        
        let totalError = 0;
        let crossingErrors = 0;
        let isRedGreenHint = false;
        let isBlueYellowHint = false;

        for (let i = 0; i < userOrder.length - 1; i++) {
            const current = userOrder[i];
            const next = userOrder[i+1];
            const diff = Math.abs(current - next);
            
            totalError += diff;
            
            // In the D-15 test, a true "crossing" error goes across the color circle
            // which translates to a difference of 4 or more between adjacent caps in the ideal sequence.
            if (diff >= 4) {
                crossingErrors++;
                
                // Rough axis estimation based on typical crossing pairs
                // Protan/Deutan (Red-Green) typically cross from ends (1-15, 2-14, 3-13 etc)
                // Tritan (Blue-Yellow) typically cross middle to ends (7-15, 8-14, etc)
                const sum = current + next;
                if (sum >= 12 && sum <= 18 && diff >= 6) {
                    isRedGreenHint = true;
                } else if (sum >= 19 && diff >= 5) {
                    isBlueYellowHint = true;
                }
            }
        }

        // Perfect score is 15 (15 steps of 1)
        const errorMargin = totalError - 15;

        let resultName = "Normal Color Vision";
        let resultDesc = "Good work! Your arrangement is completely accurate. Your color vision appears to be perfectly normal.";
        let severity = 0;
        let detectedType = "none";

        // A margin of <= 2 is often considered a simple transposition (e.g. 1, 3, 2) and is normal.
        if (crossingErrors > 0 || errorMargin > 4) {
            severity = Math.min(100, Math.max(15, (errorMargin / 40) * 100));
            
            if (crossingErrors >= 2) {
                resultName = "Color Vision Deficiency Detected";
                resultDesc = "Your arrangement showed major crossing errors, indicating a color vision deficiency.";
                
                if (isRedGreenHint) {
                    resultDesc += " The pattern strongly suggests a Red-Green deficiency (Possible Protan or Deutan).";
                    detectedType = "protan_deutan";
                } else if (isBlueYellowHint) {
                    resultDesc += " The pattern suggests a Blue-Yellow deficiency (Possible Tritan).";
                    detectedType = "tritan";
                }
            } else {
                resultName = "Mild Color Confusion";
                resultDesc = "You had minor deviations. This can happen from screen glare or mild color confusion, but doesn't strictly indicate a severe deficiency. It is possible you have a very mild anomaly.";
                detectedType = "mild";
            }
        } else if (errorMargin > 0) {
            resultDesc = "Good work! You had very minor misplacements, but this is within the normal range. Your color vision is normal.";
        }

        showFinalResults(resultName, detectedType, severity, resultDesc, userOrder);
    });

    const showFinalResults = (status, type, severity, desc, d15Order = null) => {
        document.getElementById('deficiency-type').textContent = status;
        document.getElementById('deficiency-desc').textContent = desc;
        
        const severityContainer = document.getElementById('severity-container');
        if (severity > 0) {
            severityContainer.classList.remove('hidden');
            const meterFill = document.getElementById('meter-fill');
            // reset before animating
            meterFill.style.width = '0%';
            setTimeout(() => {
                meterFill.style.width = `${severity}%`;
                if (severity < 30) {
                    meterFill.style.background = 'var(--primary)';
                } else if (severity < 70) {
                    meterFill.style.background = '#f59e0b'; // warning
                } else {
                    meterFill.style.background = 'var(--danger)';
                }
            }, 100);
        } else {
            severityContainer.classList.add('hidden');
        }

        // Draw Error Axis if test was taken
        const axisContainer = document.getElementById('error-axis-container');
        if (d15Order) {
            axisContainer.classList.remove('hidden');
            drawErrorAxis(d15Order);
        } else {
            axisContainer.classList.add('hidden');
        }

        // Save to local storage profile
        const profileData = {
            status: status,
            type: type,
            severity: severity,
            d15Order: d15Order,
            ishiharaScore: ishiharaScore
        };
        localStorage.setItem('colouraid_profile', JSON.stringify(profileData));
        checkUploaderLockState(profileData);

        showStep(stepResults);
    };

    const drawErrorAxis = (userOrder) => {
        const canvas = document.getElementById('error-axis-canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const center = { x: width / 2, y: height / 2 };
        const radius = 110;

        ctx.clearRect(0, 0, width, height);

        // Coordinates for the 15 points in a circle (plus reference cap)
        // 0 is reference, 1-15 are the colors. Placed clockwise.
        const totalPoints = 16;
        const points = [];
        
        for (let i = 0; i < totalPoints; i++) {
            // Start Reference Cap (0) at top
            const angle = (i * (2 * Math.PI) / totalPoints) - (Math.PI / 2);
            points.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle),
                id: i
            });
        }

        // Draw outer ideal circle (faint)
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const nextIdx = (i + 1) % points.length;
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[nextIdx].x, points[nextIdx].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Draw User's Lines
        ctx.beginPath();
        for (let i = 0; i < userOrder.length - 1; i++) {
            const currentPoint = points[userOrder[i]];
            const nextPoint = points[userOrder[i+1]];
            
            ctx.moveTo(currentPoint.x, currentPoint.y);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            
            // Check if it's a major crossing error to highlight red
            if (Math.abs(userOrder[i] - userOrder[i+1]) >= 4) {
               ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red
               ctx.lineWidth = 2;
               ctx.stroke();
               ctx.beginPath(); // start new path for next lines
            }
        }
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)'; // Primary blue
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Points
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        points.forEach((p, idx) => {
            // Circle
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = idx === 0 ? '#1c7cab' : d15Colors[idx - 1].hex;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Label Number (outside)
            const labelRadius = radius + 20;
            const angle = (idx * (2 * Math.PI) / totalPoints) - (Math.PI / 2);
            const labelX = center.x + labelRadius * Math.cos(angle);
            const labelY = center.y + labelRadius * Math.sin(angle);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(idx === 0 ? 'R' : idx, labelX, labelY);
        });
    };

    document.getElementById('reset-test-btn').addEventListener('click', () => {
        localStorage.removeItem('colouraid_profile');
        checkUploaderLockState(null);
        showStep(stepStart);
        const meterFill = document.getElementById('meter-fill');
        if(meterFill) meterFill.style.width = '0%';
    });

    // --- Accessibility Controls Logic ---
    const accessLockedState = document.getElementById('upload-locked-state'); // Reuse old IDs for locked state
    const accessActiveState = document.getElementById('upload-active-state');
    const lockMessage = document.getElementById('lock-message');
    const activeThemeDesc = document.getElementById('active-theme-desc');
    const themeRadios = document.getElementsByName('theme-override');

    const applyTheme = (themeName) => {
        document.documentElement.setAttribute('data-theme', themeName);
        // Sync radio buttons
        Array.from(themeRadios).forEach(r => {
            if (r.value === themeName) {
                r.checked = true;
            }
        });
    };

    const checkAccessibilityLockState = (profile) => {
        if (!profile) {
            accessLockedState.classList.remove('hidden');
            accessActiveState.classList.add('hidden');
            lockMessage.textContent = "Please take the Vision Assessment first to unlock adaptive themes.";
            applyTheme('default');
            return;
        }

        // Unlock controls
        accessLockedState.classList.add('hidden');
        accessActiveState.classList.remove('hidden');

        if (profile.severity < 15 || profile.type === "none") {
            lockMessage.textContent = "Your color vision is normal! No adaptive theme is strictly necessary.";
            applyTheme('default');
            activeThemeDesc.textContent = "Your vision is normal. The standard theme remains active, but you can manually preview accessibility themes below.";
        } else {
            // Apply deficiency-specific theme
            const themeToApply = profile.type === "red-green" || profile.type === "protan_deutan" ? "protan_deutan" : 
                                 profile.type === "blue-yellow" || profile.type === "tritan" ? "tritan" : "default";
            
            applyTheme(themeToApply);
            
            let descriptiveName = themeToApply === 'protan_deutan' ? 'Red-Green High Contrast' : 
                                  themeToApply === 'tritan' ? 'Blue-Yellow Isolation' : 'Standard';
            activeThemeDesc.textContent = `Based on your assessment, the "${descriptiveName}" adaptive color theme has been automatically applied across the interface.`;
        }
    };

    // Listen for manual overrides
    Array.from(themeRadios).forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                applyTheme(e.target.value);
            }
        });
    });

    // Replace the old specific checkUploaderLockState variable scope here to prevent script errors
    window.checkUploaderLockState = (profile) => {
        checkAccessibilityLockState(profile);
        checkImageCorrectionLockState(profile);
    };

    // Initial check on load
    const savedProfile = JSON.parse(localStorage.getItem('colouraid_profile'));
    checkAccessibilityLockState(savedProfile);


    // --- Image Correction Logic ---
    const imageLockedState = document.getElementById('image-locked-state');
    const imageActiveState = document.getElementById('image-active-state');
    const imageLockMessage = document.getElementById('image-lock-message');
    
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const previewContainer = document.getElementById('preview-container');
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const clearBtn = document.getElementById('clear-btn');
    const viewBtns = document.querySelectorAll('.view-btn');
    const processingStatus = document.getElementById('processing-status');

    let currentImage = null;
    let originalImageData = null;
    let simulatedImageData = null;
    let correctedImageData = null;

    const checkImageCorrectionLockState = (profile) => {
        if (!profile) {
            imageLockedState.classList.remove('hidden');
            imageActiveState.classList.add('hidden');
            imageLockMessage.textContent = "Please take the Vision Assessment first to unlock adaptive image correction.";
            return;
        }

        if (profile.severity < 15 || profile.type === "none") {
            imageLockedState.classList.remove('hidden');
            imageActiveState.classList.add('hidden');
            imageLockMessage.textContent = "Your color vision is normal! Image adjustments are not necessary.";
        } else {
            imageLockedState.classList.add('hidden');
            imageActiveState.classList.remove('hidden');
        }
    };

    checkImageCorrectionLockState(savedProfile);

    // File Handling
    browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });

    const handleFile = (file) => {
        if (!file.type.match('image.*')) {
            alert('Please select an image file (PNG, JPG, WEBP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                currentImage = img;
                renderOriginalImage();
                dropZone.classList.add('hidden');
                previewContainer.classList.remove('hidden');
                
                // Reset toggles to Original
                setActiveView('original');
                
                // Pre-calculate other modes to make toggling instant
                processImageModes();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const renderOriginalImage = () => {
        const maxWidth = 800; // max width for performance
        let width = currentImage.width;
        let height = currentImage.height;

        if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(currentImage, 0, 0, width, height);
        
        // Cache original data
        originalImageData = ctx.getImageData(0, 0, width, height);
        simulatedImageData = null;
        correctedImageData = null;
    };

    // View Toggling logic
    const setActiveView = (viewName) => {
        viewBtns.forEach(btn => {
            if (btn.dataset.view === viewName) {
                btn.classList.add('active');
                btn.style.background = 'var(--primary)';
                btn.style.color = '#fff';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-main)';
            }
        });

        if (viewName === 'original' && originalImageData) {
            ctx.putImageData(originalImageData, 0, 0);
        } else if (viewName === 'simulated' && simulatedImageData) {
            ctx.putImageData(simulatedImageData, 0, 0);
        } else if (viewName === 'corrected' && correctedImageData) {
            ctx.putImageData(correctedImageData, 0, 0);
        }
    };

    viewBtns.forEach(btn => {
        btn.addEventListener('click', (e) => setActiveView(e.target.dataset.view));
    });

    clearBtn.addEventListener('click', () => {
        currentImage = null;
        originalImageData = null;
        simulatedImageData = null;
        correctedImageData = null;
        fileInput.value = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        previewContainer.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    // --- Image Processing Algorithms ---
    // Full Daltonization Pipeline using LMS cone color space
    const processImageModes = () => {
        processingStatus.textContent = "(Processing image...)";
        
        setTimeout(() => {
            const width = canvas.width;
            const height = canvas.height;
            const profile = JSON.parse(localStorage.getItem('colouraid_profile'));
            const type = profile ? profile.type : 'protan'; // Default fallback
            
            simulatedImageData = new ImageData(new Uint8ClampedArray(originalImageData.data), width, height);
            correctedImageData = new ImageData(new Uint8ClampedArray(originalImageData.data), width, height);
            
            const simData = simulatedImageData.data;
            const corData = correctedImageData.data;
            const totalPixels = simData.length;

            // Matrices for RGB to LMS conversion (Hunt-Pointer-Estevez transformation)
            const rgb2lms = [
                [ 17.8824, 43.5161,  4.11935],
                [  3.45565, 27.1554,  3.86714],
                [  0.02996,  0.18431,  1.46709]
            ];
            const lms2rgb = [
                [ 0.080944, -0.130504,  0.116721],
                [-0.0102485,  0.0540193, -0.113615],
                [-0.0003652, -0.0041216,  0.693511]
            ];

            // Simulation Matrices in LMS Space
            let simulateMatrix;
            if (type === 'protan' || type === 'protan_deutan') {
                simulateMatrix = [
                    [0, 2.02344, -2.52581],
                    [0, 1, 0],
                    [0, 0, 1]
                ];
            } else if (type === 'deutan' || type === 'red-green') {
                simulateMatrix = [
                    [1, 0, 0],
                    [0.494207, 0, 1.24827],
                    [0, 0, 1]
                ];
            } else { // tritan
                simulateMatrix = [
                    [1, 0, 0],
                    [0, 1, 0],
                    [-0.395913, 0.801109, 0]
                ];
            }

            // Error Shifting Matrices (Daltonization shift into visible channels)
            let errorCorrectionMatrix;
            if (type === 'protan' || type === 'protan_deutan') {
                errorCorrectionMatrix = [
                    [0, 0, 0],
                    [0.7, 1.0, 0],
                    [0.7, 0, 1.0]
                ];
            } else if (type === 'deutan' || type === 'red-green') {
                errorCorrectionMatrix = [
                    [1.0, 0.7, 0],
                    [0, 0, 0],
                    [0, 0.7, 1.0]
                ];
            } else { // tritan
                errorCorrectionMatrix = [
                    [1.0, 0, 0.7],
                    [0, 1.0, 0.7],
                    [0, 0, 0]
                ];
            }

            // Process every pixel
            for (let i = 0; i < totalPixels; i += 4) {
                let r = simData[i];
                let g = simData[i + 1];
                let b = simData[i + 2];

                // Remove gamma (linearize)
                // Using simplified sRGB gamma decoding for speed (exact is piecewise, this is close enough)
                let r_lin = Math.pow(r / 255.0, 2.2);
                let g_lin = Math.pow(g / 255.0, 2.2);
                let b_lin = Math.pow(b / 255.0, 2.2);

                // 1. Convert to LMS
                let L = rgb2lms[0][0]*r_lin + rgb2lms[0][1]*g_lin + rgb2lms[0][2]*b_lin;
                let M = rgb2lms[1][0]*r_lin + rgb2lms[1][1]*g_lin + rgb2lms[1][2]*b_lin;
                let S = rgb2lms[2][0]*r_lin + rgb2lms[2][1]*g_lin + rgb2lms[2][2]*b_lin;

                // 2. Simulate Color Blindness in LMS
                let L_sim = simulateMatrix[0][0]*L + simulateMatrix[0][1]*M + simulateMatrix[0][2]*S;
                let M_sim = simulateMatrix[1][0]*L + simulateMatrix[1][1]*M + simulateMatrix[1][2]*S;
                let S_sim = simulateMatrix[2][0]*L + simulateMatrix[2][1]*M + simulateMatrix[2][2]*S;

                // 3. Convert Simulated LMS back to RGB
                let sim_r_lin = lms2rgb[0][0]*L_sim + lms2rgb[0][1]*M_sim + lms2rgb[0][2]*S_sim;
                let sim_g_lin = lms2rgb[1][0]*L_sim + lms2rgb[1][1]*M_sim + lms2rgb[1][2]*S_sim;
                let sim_b_lin = lms2rgb[2][0]*L_sim + lms2rgb[2][1]*M_sim + lms2rgb[2][2]*S_sim;

                // 4. Calculate Difference (Error) between original and simulated linear RGB
                let err_r = r_lin - sim_r_lin;
                let err_g = g_lin - sim_g_lin;
                let err_b = b_lin - sim_b_lin;

                // 5. Shift Error to Visible Channels
                let shift_r = errorCorrectionMatrix[0][0]*err_r + errorCorrectionMatrix[0][1]*err_g + errorCorrectionMatrix[0][2]*err_b;
                let shift_g = errorCorrectionMatrix[1][0]*err_r + errorCorrectionMatrix[1][1]*err_g + errorCorrectionMatrix[1][2]*err_b;
                let shift_b = errorCorrectionMatrix[2][0]*err_r + errorCorrectionMatrix[2][1]*err_g + errorCorrectionMatrix[2][2]*err_b;

                // 6. Add Correction to Original RGB
                let cor_r_lin = r_lin + shift_r;
                let cor_g_lin = g_lin + shift_g;
                let cor_b_lin = b_lin + shift_b;

                // Re-apply gamma and clamp
                // Simulation
                simData[i]     = Math.max(0, Math.min(255, Math.pow(Math.max(0, sim_r_lin), 1 / 2.2) * 255));
                simData[i + 1] = Math.max(0, Math.min(255, Math.pow(Math.max(0, sim_g_lin), 1 / 2.2) * 255));
                simData[i + 2] = Math.max(0, Math.min(255, Math.pow(Math.max(0, sim_b_lin), 1 / 2.2) * 255));
                
                // Correction
                corData[i]     = Math.max(0, Math.min(255, Math.pow(Math.max(0, cor_r_lin), 1 / 2.2) * 255));
                corData[i + 1] = Math.max(0, Math.min(255, Math.pow(Math.max(0, cor_g_lin), 1 / 2.2) * 255));
                corData[i + 2] = Math.max(0, Math.min(255, Math.pow(Math.max(0, cor_b_lin), 1 / 2.2) * 255));
            }
            
            processingStatus.textContent = "(Processing complete)";
            setTimeout(() => { processingStatus.textContent = ''; }, 2000);
            
            // Switch to corrected view immediately upon processing completion
            setActiveView('corrected');

        }, 50);
    };

});
