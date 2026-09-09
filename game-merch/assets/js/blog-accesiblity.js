document.addEventListener('DOMContentLoaded', function () {

    // ------------------ track word count limit and block if over
    const WORD_LIMIT = 500;
    const contentInput = document.getElementById('post-content');
    const postForm = document.querySelector('.post-form');
    const postFeed = document.getElementById('postFeed');
    const userPostsList = document.querySelector('.user-posts-list');

    function countWords(text) {
        return String(text || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length;
        }

    function updateWordCount() {
        if (!contentInput) {
            return;
        }
        const count = countWords(contentInput.value);
        let counter = document.getElementById('post-word-count');
        if (!counter) { counter = document.createElement('div');
            counter.id = 'post-word-count';
            counter.className = 'post-word-count';
            contentInput.parentNode.appendChild(counter);
        }

        counter.textContent = `${count} / ${WORD_LIMIT} words`;
        if (count > WORD_LIMIT) { counter.classList.add( 'word-limit-exceeded');
            contentInput.classList.add( 'word-limit-exceeded-input');
        } else { counter.classList.remove( 'word-limit-exceeded');
            contentInput.classList.remove( 'word-limit-exceeded-input');
        }
    }

    if (contentInput) {
        contentInput.addEventListener( 'input', updateWordCount);
        updateWordCount();
    }

    if (postForm) {
        postForm.addEventListener( 'submit',
            function (event) {
                if ( countWords(contentInput.value) > WORD_LIMIT ) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    alert( `Total word count is over ${WORD_LIMIT} words.`);
                    contentInput.focus();
                    return false;
                }
            },
            true
        );
    }

    // ----------------------- dark mode button
    function applyDarkMode(enabled) {
        document.body.classList.toggle( 'blog-dark-mode', enabled );
        localStorage.setItem( 'blog-dark-mode',
            enabled ? 'true' : 'false'
        );

        const button = document.getElementById( 'blog-dark-mode-btn');
        if (button) {
            button.textContent = enabled
                    ? '🔦 Light Mode'
                    : '👀 Dark Mode';
        }
    }

    function createDarkModeButton() {
        if ( document.getElementById( 'blog-dark-mode-btn')) { 
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'blog-dark-mode-btn';
        button.className = 'blog-acc-button blog-dark-mode-btn';
        button.addEventListener('click',
            function () {
                applyDarkMode(
                    !document.body.classList.contains(
                        'blog-dark-mode'
                    )
                );
            }
        );

        document.body.appendChild(button);
        applyDarkMode( localStorage.getItem( 'blog-dark-mode') === 'true'
        );
    }
    createDarkModeButton();

    // -------------------------------- blog resizes
    function applyBlogSize(value) {
        document.documentElement.style.setProperty( '--blog-custom-width', `${value}px`);
        localStorage.setItem( 'blog-custom-width', value);
    }

    function applyTextSize(value) {
        document.documentElement.style.setProperty( '--blog-custom-text-size', `${value}px`);
        localStorage.setItem( 'blog-custom-text-size', value);
    }

    function createResizePanel() {
        if (document.getElementById( 'blog-resize-panel') ) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'blog-resize-panel';
        panel.className =  'blog-resize-panel';

        const savedWidth = Number( localStorage.getItem( 'blog-custom-width') ) || 720;
        const savedTextSize = Number( localStorage.getItem( 'blog-custom-text-size') ) || 16;
        const savedTTSVolume = Number( localStorage.getItem( 'blog-tts-volume') );
        const ttsVolume =Number.isFinite(savedTTSVolume)? savedTTSVolume: 1;

        panel.innerHTML = `<label>
                TTS Volume
                <input   id="blog-tts-volume-range"
                         type="range"
                         min="0"
                         max="1"
                         step="0.01"
                         value="${ttsVolume}" />
            </label>

            <div class="blog-resize-title"> Custom Size </div>
            <label> Blog Width
                <input  id="blog-width-range"
                        type="range"
                        min="600"
                        max="1100"
                        value="${savedWidth}"/>
                    
            </label>

            <label>
                Text Size
                <input  id="blog-text-range"
                        type="range"
                        min="14"
                        max="24"
                        value="${savedTextSize}"/>
            </label> `;
        document.body.appendChild(
            panel);

        const widthRange = document.getElementById('blog-width-range');
        const textRange =  document.getElementById('blog-text-range');
        const ttsVolumeRange = document.getElementById('blog-tts-volume-range');

        ttsVolumeRange.addEventListener('input',
            function () { applyTTSVolume( this.value);
            }
        );

        widthRange.addEventListener('input',
            function () { applyBlogSize( this.value);
            }
        );

        textRange.addEventListener('input',
            function () { applyTextSize( this.value);
            }
        );

        applyBlogSize(savedWidth);
        applyTextSize(savedTextSize);
    }
    createResizePanel();

    // -------------------------------- tts
    let currentSpeech = null;
    function stopSpeech() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            currentSpeech = null;
        }
    }

function applyTTSVolume(value) {
    const volume = Number(value);
    localStorage.setItem( 'blog-tts-volume', volume);

    // restart ongoing tts if volume is changed
    if ( currentSpeech && !window.speechSynthesis.paused) {
        const currentText = currentSpeech.text;
        window.speechSynthesis.cancel();
        currentSpeech = null;
        setTimeout( function () {
                if (!currentText) { return;}
                currentSpeech = new SpeechSynthesisUtterance( currentText);
                currentSpeech.rate = 1;
                currentSpeech.pitch = 1;
                currentSpeech.volume = volume;
                window.speechSynthesis.speak( currentSpeech);
            },
            50
        );
    }
}

    function speakPost(content) {
        if ( !('speechSynthesis' in window) ) {
            return;
        }

        stopSpeech();
        currentSpeech = new SpeechSynthesisUtterance( content);
        currentSpeech.rate = 1;
        currentSpeech.pitch = 1;
        currentSpeech.volume = Number( localStorage.getItem('blog-tts-volume')) || 1;
        window.speechSynthesis.speak(currentSpeech);
    }


    function addSpeechAndCloseControls(card) {
        if (!card) {
             return;
        }

        const detail = card.querySelector('.detailed-content');
        const articleContent = card.querySelector('.article-content');
        if (!detail || !articleContent ) {
            return;
        }

        if (detail.querySelector('.blog-detail-controls') ) {
            return;
        }

        const controls =document.createElement('div');
        controls.className = 'blog-detail-controls';
        const speechButton = document.createElement('button');
        speechButton.type = 'button';
        speechButton.textContent = '🔊 Read Aloud';
        speechButton.addEventListener('click',
            function (event) {
                event.preventDefault();
                event.stopPropagation();
                speakPost( articleContent.textContent);
            }
        );

        const closeButton = document.createElement('button');
        closeButton.type ='button';
        closeButton.textContent = '✕ Close';
        closeButton.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                stopSpeech();

                detail.style.display ='none';
                card.classList.remove('expanded');
                const readLink = card.querySelector( '.read-link');
                if (readLink) { readLink.textContent = 'Read More';
                }

                window.scrollTo({
                    top: card.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        );

        controls.appendChild( speechButton);
        controls.appendChild(closeButton);
        detail.insertBefore(controls, detail.firstChild);
    }

    function setupDynamicCards() {
        if (!postFeed) {
            return;
        }

        const observer = new MutationObserver(
                function () {
                    postFeed.querySelectorAll('.blog-card')
                        .forEach( addSpeechAndCloseControls);
                }
            );

        observer.observe( postFeed,
            {
                childList: true,
                subtree: true
            }
        );

        postFeed.querySelectorAll('.blog-card')
            .forEach(addSpeechAndCloseControls);
    }
    setupDynamicCards();

    // ------------------------------------------------------------ stop tts on show less/leaving page
    document.addEventListener( 'click',
        function (event) {
            const readLink = event.target.closest( '.read-link');
            if (!readLink) {
                return;
            }

            const card = readLink.closest('.blog-card');
            if (!card) {
                return;
            }

            const detail =card.querySelector('.detailed-content');
            if (!detail) {
                return;
            }

            if (detail.style.display !== 'none') {
                stopSpeech();
            }
        },
        true
    );
    window.addEventListener( 'beforeunload', stopSpeech);
});