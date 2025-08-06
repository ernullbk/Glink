document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    const processBtn = document.getElementById('processBtn');
    const apiUrlInput = document.getElementById('apiUrl');
    const statusDiv = document.getElementById('status');
    const targetUrl = 'https://m.snappfood.ir/';

    processBtn.addEventListener('click', () => {
        const apiUrl = apiUrlInput.value.trim();
        if (!apiUrl) {
            updateStatus('لطفا لینک را وارد کنید.', true);
            return;
        }
        processLink(apiUrl);
    });

    function updateStatus(message, isError = false) {
        statusDiv.innerText = message;
        statusDiv.style.color = isError ? '#e74c3c' : '#2ecc71';
    }

    function setButtonState(isLoading) {
        processBtn.disabled = isLoading;
        processBtn.innerText = isLoading ? 'در حال پردازش...' : 'ارسال';
    }

    async function processLink(apiUrl) {
        setButtonState(true);
        updateStatus('در حال دریافت اطلاعات از لینک...');

        try {
            // مرحله 1: دریافت پاسخ از لینک
            const response = await cordova.plugin.http.sendRequest(apiUrl, { method: 'get' });
            
            // مرحله 2: پارس کردن JSON اولیه
            const data = JSON.parse(response.data);
            if (!data.JWT || typeof data.JWT !== 'string') {
                throw new Error('فرمت پاسخ اولیه نامعتبر است یا کلید JWT وجود ندارد.');
            }
            
            // مرحله 3: پارس کردن JSON داخلی که در مقدار JWT قرار دارد
            const jwtData = JSON.parse(data.JWT);

            updateStatus('اطلاعات دریافت شد، در حال تنظیم کوکی‌ها...');

            [cite_start]// مرحله 4: تنظیم تمام 5 کوکی لازم، دقیقا مانند background.js [cite: 42-47]
            const cookiePromises = [
                cordova.plugin.http.setCookie(targetUrl, `jwt-access_token=${jwtData.access_token}; path=/;`),
                cordova.plugin.http.setCookie(targetUrl, `jwt-token_type=${jwtData.token_type}; path=/;`),
                cordova.plugin.http.setCookie(targetUrl, `jwt-refresh_token=${jwtData.refresh_token}; path=/;`),
                cordova.plugin.http.setCookie(targetUrl, `jwt-expires_in=${jwtData.expires_in}; path=/;`),
                cordova.plugin.http.setCookie(targetUrl, 'UserMembership=0; path=/;')
            ];

            await Promise.all(cookiePromises);

            updateStatus('انجام شد! در حال انتقال به اسنپ‌فود...');
            
            // مرحله 5: هدایت کاربر به سایت اسنپ‌فود
            window.location.href = targetUrl;

        } catch (error) {
            console.error(JSON.stringify(error));
            let errorMessage = 'یک خطای ناشناخته رخ داد.';
            if (error.status) {
                errorMessage = `خطا در اتصال به سرور (کد: ${error.status}). لینک ممکن است نامعتبر باشد.`;
            } else if (error.message) {
                errorMessage = `خطا در پردازش: ${error.message}`;
            }
            updateStatus(errorMessage, true);
            setButtonState(false);
        }
    }
}
