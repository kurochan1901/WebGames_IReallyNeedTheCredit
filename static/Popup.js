// 顯示或隱藏彈出視窗
function togglePopup() {
    let popup = document.getElementById("popup");
    popup.style.display = (popup.style.display === "block") ? "none" : "block";
}

// 關閉彈出視窗
function closePopup() {
    let popup = document.getElementById("popup");
    popup.style.display = "none";
}
