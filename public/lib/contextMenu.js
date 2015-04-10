// src = https://jsfiddle.net/KyleMit/X9tgY/
var cutFileId = docCookies.getItem("cutFileId");
if (cutFileId){
    $("#context-menu-paste").removeClass("hidden");
} else {
    $("#context-menu-paste").addClass("hidden");
}

(function ($, window) {

    $.fn.contextMenu = function (settings) {

        return this.each(function () {

            // Open context menu
            $(this).on("contextmenu", function (e) {
                if (settings.before){
                    settings.before.call(this, $(e.target));
                }

                //open menu
                $(settings.menuSelector)
                    .data("invokedOn", $(e.target))
                    .show()
                    .css({
                        position: "absolute",
                        left: getLeftLocation(e),
                        top: getTopLocation(e)
                    })
                    .off('click')
                    .on('click', function (e) {
                        $(this).hide();
                
                        var $invokedOn = $(this).data("invokedOn");
                        var $selectedMenu = $(e.target);
                        
                        settings.menuSelected.call(this, $invokedOn, $selectedMenu);
                });
                
                return false;
            });

            //make sure menu closes on any click
            $(document).click(function () {
                $(settings.menuSelector).hide();
            });
        });

        function getLeftLocation(e) {
            var mouseWidth = e.pageX;
            var pageWidth = $(window).width();
            var menuWidth = $(settings.menuSelector).width();
            
            // opening menu would pass the side of the page
            if (mouseWidth + menuWidth > pageWidth &&
                menuWidth < mouseWidth) {
                return mouseWidth - menuWidth;
            } 
            return mouseWidth;
        }        
        
        function getTopLocation(e) {
            var mouseHeight = e.pageY;
            var pageHeight = $(window).height();
            var menuHeight = $(settings.menuSelector).height();

            // opening menu would pass the bottom of the page
            if (mouseHeight + menuHeight > pageHeight &&
                menuHeight < mouseHeight) {
                return mouseHeight - menuHeight;
            } 
            return mouseHeight;
        }

    };
})(jQuery, window);

$("#main-file-panel").contextMenu({
    menuSelector: "#contextMenu",

    before: function(invokedOn){
        //console.log(invokedOn)
        if (invokedOn.is('#file-list > tbody td')){
            $("#context-menu-open").removeClass("hidden");
            $("#context-menu-download").removeClass("hidden");
            $("#context-menu-cut").removeClass("hidden");
            $("#context-menu-delete").removeClass("hidden");
        } else {
            $("#context-menu-open").addClass("hidden");
            $("#context-menu-download").addClass("hidden");
            $("#context-menu-cut").addClass("hidden");
            $("#context-menu-delete").addClass("hidden");
        }
    },

    menuSelected: function (invokedOn, selectedMenu) {

        if (selectedMenu.text().toLowerCase() === 'delete'){
            var fileId = invokedOn.parent().attr('fileid');
            deleteFileById(fileId);
        }

        if (selectedMenu.text().toLowerCase() === 'cut'){
            cutFileId = invokedOn.parent().attr('fileid');
            $("#context-menu-paste").removeClass("hidden");
            docCookies.setItem("cutFileId", cutFileId);
        }

        if (selectedMenu.text().toLowerCase() === 'paste'){
            var targetType = invokedOn.parent().find('td[aria-label="type"]').html();
            //console.log(invokedOn.parent().attr('fileid'));

            var targetFileId;
            if (targetType.toLowerCase() === 'dir'){
                targetFileId = invokedOn.parent().attr('fileid');

            } else {
                var targetFileId = dir;
            }

            //console.log('type = %s \t targetFileId = ', targetType, targetFileId);

            docCookies.removeItem("cutFileId");
            $("#context-menu-paste").addClass("hidden");

            moveFileById(cutFileId, targetFileId);
        }
/*
        var msg = "You selected the menu item '" + selectedMenu.text() +
            "' on the value '" + invokedOn.text() + "'";
        alert(msg);
*/ 
    }
});