document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');

    const fetchBtn = document.getElementById('fetchBtn');
    const apiUrlInput = document.getElementById('apiUrl');
    const statusDiv = document.getElementById('status');
    const targetUrl = 'https://m.snappfood.ir/';

    fetchBtn.addEventListener('click', () => {
        const apiUrl = apiUrlInput.value.trim();
        if (!apiUrl) {
            updateStatus('لطفا لینک را وارد کنید', true);
            return;
        }
        processUrl(apiUrl);
    });

    function updateStatus(message, isError = false) {
        statusDiv.innerText = message;
        statusDiv.style.color = isError ? '#ff4444' : '#00c851';
    }

    function setButtonState(isLoading, message) {
        fetchBtn.disabled = isLoading;
        fetchBtn.innerText = message;
        if (isLoading) {
            fetchBtn.classList.add('loading');
        } else {
            fetchBtn.classList.remove('loading');
        }
    }
    
    // تابع اصلی
    async function processUrl(apiUrl) {
        setButtonState(true, 'در حال دریافت توکن...');
        updateStatus('درحال پردازش لینک...');

        try {
            // 1. دریافت JSON از لینک با استفاده از پلاگین HTTP
            const response = await cordova.plugin.http.sendRequest(apiUrl, { method: 'get' });
            const data = JSON.parse(response.data);
            const jwtString = data.JWT;
            const jwtData = JSON.parse(jwtString);
            
            updateStatus('توکن دریافت شد. در حال تنظیم کوکی‌ها...');

            // 2. تنظیم کوکی‌ها به صورت نیتیو
            cordova.plugin.http.setCookie(targetUrl, `jwt-access_token=${jwtData.access_token}; path=/;`);
            cordova.plugin.http.setCookie(targetUrl, `jwt-token_type=${jwtData.token_type}; path=/;`);
            cordova.plugin.http.setCookie(targetUrl, `jwt-refresh_token=${jwtData.refresh_token}; path=/;`);
            cordova.plugin.http.setCookie(targetUrl, `jwt-expires_in=${jwtData.expires_in}; path=/;`);
            cordova.plugin.http.setCookie(targetUrl, 'UserMembership=0; path=/;');

            updateStatus('کوکی‌ها تنظیم شد. در حال باز کردن سایت...');
            
            // 3. هدایت کاربر به سایت اسنپ‌فود
            window.location.href = targetUrl;

        } catch (error) {
            console.error(JSON.stringify(error));
            updateStatus('خطا در پردازش لینک یا تنظیم کوکی. لطفا دوباره تلاش کنید.', true);
            setButtonState(false, 'ارسال');
        }
    }
}
