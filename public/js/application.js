// // public/js/application.js
// document.addEventListener('DOMContentLoaded', () => {
//     const form = document.getElementById('upload-form');
//     const fileInputs = form.querySelectorAll('input[type="file"]');

//     form.addEventListener('submit', async (e) => {
//         e.preventDefault();

//         const formData = new FormData(form);

//         try {
//             const response = await fetch('/upload', {
//                 method: 'POST',
//                 body: formData
//             });

//             const result = await response.json();

//             await displayVerificationResultsWithDelay(result.verificationResults);

//             if (result.message === 'Files uploaded and verified successfully') {
//                 alert('Files uploaded and verified successfully!');
//                 setTimeout(() => { window.location.href = '/home'; }, 3000);
//             } else {
//                 await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay before alert
//                 handleVerificationFailure(result.verificationResults);
//             }
//         } catch (error) {
//             console.error('Error uploading files:', error);
//             alert('Error uploading files. Please try again.');
//         }
//     });

//     async function displayVerificationResultsWithDelay(results) {
//         for (const input of fileInputs) {
//             const statusElement = document.getElementById(`${input.name}-status`);
//             const result = results[input.name];
//             if (result) {
//                 await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay for each document
//                 statusElement.textContent = result.verified ? '✅' : '❌';
//                 statusElement.title = result.message;
//             } else {
//                 statusElement.textContent = '';
//                 statusElement.title = '';
//             }
//         }
//     }

//     function handleVerificationFailure(results) {
//         let failedDocuments = [];
//         for (const [docName, result] of Object.entries(results)) {
//             if (!result.verified) {
//                 failedDocuments.push(docName);
//             }
//         }

//         if (failedDocuments.length > 0) {
//             const failedDocsString = failedDocuments.join(', ');
//             alert(`The following documents were not verified: ${failedDocsString}. Please upload properly scanned documents and try again.`);
//             // Refresh the page
//             window.location.reload();
//         }
//     }
// });

// public/js/application.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const fileInputs = form.querySelectorAll('input[type="file"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            await displayVerificationResultsWithDelay(result.verificationResults);

            if (result.message === 'Files uploaded and verified successfully') {
                alert('Files uploaded and verified successfully!');
                setTimeout(() => { window.location.href = '/result'; }, 200); // Redirect to results page
            } else {
                await new Promise(resolve => setTimeout(resolve, 200)); // 1 second delay before alert
                handleVerificationFailure(result.verificationResults);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error uploading files. Please try again.');
        }
    });

    async function displayVerificationResultsWithDelay(results) {
        for (const input of fileInputs) {
            const statusElement = document.getElementById(`${input.name}-status`);
            const result = results[input.name];
            if (result) {
                await new Promise(resolve => setTimeout(resolve, 100)); //
                statusElement.textContent = result.verified ? '✅' : '❌';
                statusElement.title = result.message;
            } else {
                statusElement.textContent = '';
                statusElement.title = '';
            }
        }
    }

    function handleVerificationFailure(results) {
        let failedDocuments = [];
        for (const [docName, result] of Object.entries(results)) {
            if (!result.verified) {
                failedDocuments.push(docName);
            }
        }

        if (failedDocuments.length > 0) {
            const failedDocsString = failedDocuments.join(', ');
            alert(`The following documents were not verified: ${failedDocsString}. Please upload properly scanned documents and try again.`);
            // Refresh the page
            window.location.reload();
        }
    }
});