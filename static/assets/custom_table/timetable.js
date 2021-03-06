
$(document).ready(function() {

    var color_list = [
        // new list, last element array checks whether the color has been used
        ['ff033e',255,  3, 62, 0], // American rose
        ['7fffd4',127,255,212, 0], // Aquamarine (light blue)
        ['03c03c',  3,192, 60, 0], // Dark pastel green
        ['318ce7', 19, 55, 91, 0], // Bleu de France (blue)
        ['9966cc',153,102,204, 0], // Amethyst (purple)
    ];



    var timetable = $("#TimeTable tbody");
    timetable.children().each(function (row) { // iterate over <tr>s
        $(this).children().each(function (col) { // iterate over <td>s
            $(this).data('row', row);
            $(this).data('col', col);
        });
    });

    var courseId;
    var classType;
    var streams = [];

    // load all class when the page is loaded
    $.get("/get_all_class/",{},function (data) {
        for(var i = 0; i < data.all_class.length; i++) {
            // alert("col:"+col+",row:"+row+",courseId:"+courseId+",classType:"+classType+",hours:"+hours);
            add_class_to_timetable(data.all_class[i]);
        }
    }); 
    var click_on_class_flag = [0,-1,-1];
    
    //  this will gray out all the available timeslot
    $('body').on('dragstart','.draggable',
        function(){
            if($(this).hasClass('hasClass')) {
                click_on_class_flag = [1,$(this).data('col'), $(this).data('row')];
            }

            courseId = this.id.split('|')[0];
            classType = this.id.split('|')[1];
            // console.log('before split: id: '+ this.id);
            // console.log('split: '+ this.id.split('|')[1]);
            console.log('running class search on '+courseId+ "-" +classType);
            // check if already greyed out
            if (timetable.find('td').hasClass('tableClassSelectingAvail')) {
                $('td').removeClass('tableClassSelectingAvail');
                // $('td').removeClass('tableClassSelectingNotAvail');
            }

            $.get("/class_search/",{
                courseId: courseId,
                classType: classType,
            }, function (data) {
                // streams = data
                streams = data.streams;
                // console.log(data.streams);

                // the course and the class type from the sublinks
                timetable.children().each(function (row){
                    $(this).children().each(function (col){
                        if(class_on_timetable(col,row,data.streams) && col != 0){
                            $(this).addClass('tableClassSelectingAvail');

                            // which hour is this cell?
                            // console.log('adding class: ' + $(this));
                            var hour = which_hour(col, row, data.streams);
                            if (hour == 0) {
                                // first
                                $(this).addClass('first_hour');
                            } else if (hour == 1) {
                                // middle
                                $(this).addClass('middle_hours');
                            } else if (hour == 2) {
                                // last
                                $(this).addClass('last_hour');
                            } else if (hour == 3) {
                                $(this).addClass('individual');
                            } else {
                                console.log('illegal argument: hour');
                            }

                            $(this).addClass('dropzone');
                        } else if (col != 0) {
                            // $(this).addClass('tableClassSelectingNotAvail');
                        }
                    });
                });
            }); 
        }
    );


    timetable.find('td').on('click','div.remove_class',function() {
        var row = $(this).parent().data('row');
        var col = $(this).parent().data('col');
        remove_class_all_stream_from_timetable(col,row);
        $(this).find('div.remove_class').data('clicked',true);
    });

    // Locate which box we clicked on
    timetable.find('td').click(function () {

        if($(this).find('div.remove_class').data('clicked') == true){
            $(this).find('div.remove_class').data('clicked',false);

            return;
        }



        var row = $(this).data('row');
        var col = $(this).data('col');
        // alert("col:"+col+"row:"+row+" is clicked");
        var me = $(this);
        // var cell = $('#TimeTable tbody tr').eq(row).find('td').eq(col);
        if($(this).hasClass('hasClass')){

            // var class_info = $(this).data('class_info');
            // // console.log(class_info);
            // remove_class_all_stream_from_timetable(col,row);
            // var sidebar_classes = $('body aside.sidebar-left-collapse div.sidebar-links div.link-yellow ul.sub-links li.sidebar_classes');
            // // console.log(sidebar_classes)
            // var target_class_courseId = class_info['name'];
            // var target_class_classType = class_info['classtype'];
            // sidebar_classes.each(function(){
            //     // console.log($(this));
            //     var curr_courseId = $(this).attr('id').split('|')[0];
            //     var curr_classType = $(this).attr('id').split('|')[1];
            //     if(target_class_courseId == curr_courseId && target_class_classType == curr_classType) {
            //         $(this).trigger('click');
            //     }
            // });
        } else if ($(this).hasClass('tableClassSelectingAvail')) {
            var index_str = which_stream_index_from_col_row(streams,col,row);
            var i = index_str.split('|')[0];
            var j = index_str.split('|')[1];
            $.get("/timetable_have_classtype_this_course/",
                {
                    'courseId':  streams[i][0]['name'],
                    'classType': streams[i][0]['classtype'],
                },
                function (data) {
                    if (data.have_this_classtype == 0) {
                        for (var k = 0; k < streams[i].length; k++){
                            add_class_to_timetable(streams[i][k]);
                            add_class_to_backend(streams[i][k]);
                        }
                    }
                }
            );

            // remove all the select class tag
            $('td').removeClass('tableClassSelectingAvail');
        } else {
            $('td').removeClass('tableClassSelectingAvail'); 
        }
    });


    // friends
    $('aside.sidebar-right-collapse ul#friend_list.list-group.sidebar_friendlist').on('change','li.list-group-item div.fluid-container div.row div input',
    function(){
        if ($(this).is(':checked')) {
            // check if color has already been chosen
            var colors_available = false;
            for (var i = 0; i < color_list.length; i++) {
                if (color_list[i][4] == 0) {
                    colors_available = true;
                    break;
                }
            }
            if (colors_available) {
                //randomly choose a color until a unique color is chosen
                var color_index = Math.floor((Math.random() * 100) + 1)%color_list.length;
                while (color_list[color_index][4] == 1) {
                    color_index = Math.floor((Math.random() * 100) + 1)%color_list.length;
                }
                color_list[color_index][4] = 1;
            } else {
                //do nothing OR not allowed to overlay friend's course
                console.log('no more colors left');
            }
            // var color_index = Math.floor((Math.random() * 100) + 1)%color_list.length;
            // console.log("color_index: "+color_index);
            friend_username = $(this).val();
            $(this).data('color_index',color_index);
            $(this).parent().parent().find('div.col-xs-9 button').after("<div class='friend_username_highlight'></div>");
            $(this).parent().parent().find('div.col-xs-9 div.friend_username_highlight').css({"background-color" : "rgba("+color_list[color_index][1]+","+color_list[color_index][2]+","+color_list[color_index][3]+",0.7)",
                                                                        "border-radius":"4px",
                                                                        "padding" : "9px",
                                                                        "position" : "absolute",
                                                                        "top" : "2px",
                                                                        "left" : "5px"})

        } else {
            friend_username = $(this).val();
            $(this).parent().parent().find('div.col-xs-9 div.friend_username_highlight').remove();

            //make color avaliable again
            var color_index = $(this).data('color_index');
            color_list[color_index][4] = 0;


            // $(this).parent().parent().find('div.col-xs-9').removeClass('friend_username_highlight');
            $(this).removeData('color_index');
            remove_friends_from_timetable(friend_username);
        }
    });

    function get_classes_and_overlay_friends(color_index,friend_username) {
        $.get("/get_friends_classes/", {'friend_username' : friend_username}, function (data) {
            overlay_friends_class(data.friends_classes, friend_username, color_index);
        });
    }



    // // Helper functions
    function add_class_to_timetable (a_class) {
        var col =       which_col(a_class);
        var row =       which_row(a_class);
        var hours =     class_hours(a_class);
        var timeFrom =  a_class['timeFrom'];
        var timeTo =    a_class['timeTo'];
        var day =       a_class['day'];
        var classType = a_class['classtype'];
        var courseId =  a_class['name'];
        var cell = $('#TimeTable tbody tr').eq(row).find('td').eq(col);
        cell.addClass('hasClass draggable 1st_hour');
        cell.attr('id', courseId+"|"+classType);
        cell.data('class_info',a_class);
        if (classType === 'Tutorial-Laboratory') {
            classType = 'Tute-Lab';
        }
        cell.append("<div style='cursor: pointer;' class='remove_class pull-right'>&times;</div>");
        cell.append("<div style='cursor: move;'><b>" + courseId + "</b><br>" +classType+"</div>");
        for (var i = 1; i < hours; i++) {
            cell = $('#TimeTable tbody tr').eq(row+i).find('td').eq(col);
            cell.addClass('hasClass draggable');
            cell.attr('id', courseId+"|"+classType);
            $(cell).attr('style', 'border-top-width: 4px; border-top-color: #e8c447');
        }
    }

    function add_friend_class_to_timetable (a_class,friend_username,color_index) {
        var col =       which_col(a_class);
        var row =       which_row(a_class);
        var hours =     class_hours(a_class);
        var timeFrom =  a_class['timeFrom'];
        var timeTo =    a_class['timeTo'];
        var day =       a_class['day'];
        var classType = a_class['classtype'];
        var courseId =  a_class['name'];
        var cell = $('#TimeTable tbody tr').eq(row).find('td').eq(col);
        cell.data('friend_class_info',a_class);
        cell.data('friend_username',friend_username);
        for (var i = 0; i < hours; i++) {
            cell = $('#TimeTable tbody tr').eq(row+i).find('td').eq(col);
            cell.append("<div class='hasFriendsClass friend_class_"+friend_username+"'></div>");
            cell.find('div.hasFriendsClass.friend_class_'+friend_username).css("background-color","rgba("+color_list[color_index][1]+","+color_list[color_index][2]+","+color_list[color_index][3]+",0.7)");
            cell.find('div.hasFriendsClass.friend_class_'+friend_username).data('friend_class_info',a_class);
            cell.find('div.hasFriendsClass.friend_class_'+friend_username).data('friend_username',friend_username);
        }
    }

    function overlay_friends_class (class_list, friend_username, color_index) {
        if(typeof class_list !== 'undefined') {
            for (var i = 0; i < class_list.length; i++) {
                var a_class = class_list[i];
                var hours = class_hours(a_class);
                var col = which_col(a_class);
                var row = which_row(a_class);
                // console.log(a_class);
                // console.log(friend_username+", "+color_index);
                add_friend_class_to_timetable(a_class,friend_username,color_index);
            }
        }
    }

    function add_class_to_backend (a_class) {
        $.post("/class_add/",{
            courseId:  a_class['name'],
            classType: a_class['classtype'],
            day:       a_class['day'],
            timeFrom:  a_class['timeFrom'],
        });
    }

    function remove_friends_from_timetable (friend_username) {
        $('td').find('div.hasFriendsClass').each(function () {
            if ($(this).hasClass('friend_class_' + friend_username)) {
                $(this).parent().removeData('friend_class_info');
                $(this).parent().removeData('friend_username');
                $(this).removeData('friend_username');
                $(this).removeData('friend_class_info');
                $(this).remove();
            }
        })

    }

    // actually removing the class from the timetable and backend
    function remove_class_from_timetable (a_class) {
        var col = which_col(a_class);
        var row = which_row(a_class);
        var class_block = $('#TimeTable tbody tr').eq(row).find('td').eq(col);
        remove_class_from_backend(a_class);
        var hours = class_hours(a_class);
        for(var i = 1; i < hours; i++) {
            class_block.parent().parent().children().eq(row+i).find('td').eq(col).removeClass('hasClass');
            class_block.parent().parent().children().eq(row+i).find('td').eq(col).removeAttr('style');
        }
        // remove the whole original cell
        class_block.removeData('class_info');
        class_block.removeClass('hasClass');
        class_block.removeClass('1st_hour');
        class_block.removeAttr('style');
        class_block.removeAttr('rowspan');
        class_block.find('div').remove();
    }

    // Remove whole stream of this class from this col and row
    function remove_class_all_stream_from_timetable(col,row){
        var class_block = $('#TimeTable tbody tr').eq(row).find('td').eq(col);
        var class_info = class_block.data('class_info');
        remove_this_class_stream_from_timetable(class_info);
    }


    // remove the whole stream of this class from the given class_info
    function remove_this_class_stream_from_timetable(class_info) {
        remove_class_from_timetable(class_info);
        $.get("/class_stream_search/",{
            courseId:  class_info['name'],
            classType: class_info['classtype'],
            timeFrom:  class_info['timeFrom'],
            day:       class_info['day'],
        }, function (data) {
            // console.log(data);
            for(var i = 0; i < data.stream.length; i++){
                var target_class = data.stream[i];
                remove_class_from_timetable(target_class);
            }
        });
    }


    function remove_class_from_backend (a_class) {
        $.post("/class_remove/",{
            courseId:  a_class['name'],
            classType: a_class['classtype'],
            day:       a_class['day'],
            timeFrom:  a_class['timeFrom'],
        });
    }


    // 0 for first hour, 1 for middle hours, 2 for last hour
    function which_hour (col,row,streams) {
        var index_list = which_stream_index_from_col_row(streams,col,row);
        var stream_index = index_list.split('|')[0];
        var class_index = index_list.split('|')[1];
        var a_class = streams[stream_index][class_index];
        // console.log(a_class);
        if(a_class['timeFrom'] == (row+9)*100 && a_class['timeTo'] == (row+10)*100){
            return 3;
        } else if(a_class['timeFrom'] == (row+9)*100) {
            return 0;
        } else if (a_class['timeTo'] == (row+10)*100) {
            return 2;
        } else {
            return 1;
        }       
    }

    function which_stream_index_from_col_row (streams,col,row) {
        var r = (row + 9) * 100;
        for (var i = 0; i < streams.length; i++) {
            for(var j = 0; j < streams[i].length; j++){
                if(streams[i][j]['day'] == col-1 && streams[i][j]['timeFrom'] <= r && streams[i][j]['timeTo'] > r){
                    return i+"|"+j;
                }
            }
        }
        return "-1|-1";
    }
    


    function which_col(a_class) {
        // console.log('col is '+parseInt(a_class['day'])+1);
        return parseInt(a_class['day'])+1;
    }

    function which_row (a_class) {
        // console.log('row is '+((parseInt(a_class['timeFrom'])/100) - 9));
        return (parseInt(a_class['timeFrom'])/100) - 9;
    }

    function class_on_timetable (col,row,streams) {
        var r = (row + 9) * 100;
        for (var i = 0; i < streams.length; i++) {
            for(var j = 0; j < streams[i].length; j++){ 
                if(streams[i][j]['day'] == col-1 &&
                    streams[i][j]['timeFrom'] <= r &&
                    streams[i][j]['timeTo'] > r)
                    return true;
            }
        }
        return false;
    }

    function class_hours(a_class) {
        return Math.ceil((parseInt(a_class['timeTo']) - parseInt(a_class['timeFrom'])) / 100);
    }


    setInterval(refresh_friends_timetable,2000);

    function refresh_friends_timetable() {
        // console.log("Refresh Friends Timetable");
        $('aside.sidebar-right-collapse ul#friend_list.list-group.sidebar_friendlist li.list-group-item div.fluid-container div.row div input').each(function(){
            if ($(this).is(':checked')) {
                var username = $(this).val();
                // alert(username);
                var color_index = $(this).data('color_index');
                // console.log("getting; username: "+username+"; color_index:"+color_index);
                $.get("/get_friends_classes/", {'friend_username' : username},
                    function (data) {
                        // console.log(data.friends_classes);
                        remove_friends_from_timetable(username);
                        // console.log("remove ok");
                        overlay_friends_class(data.friends_classes,username,color_index);
                    }
                );
            }
        });
    }

    // drag drop
    // http://www.html5rocks.com/en/tutorials/dnd/basics/
    var dragSrcEl = null;
    function handleDragStart(e) {
        dragSrcEl = this;
        // console.log(this.id);
        // courseId = this.id.split('|')[0];
        // classType = this.id.split('|')[1];
    }

    function handleDragOver(e, me) {
        if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
        }

        return false;
    }

    function handleDragEnter(e, me) {
        // this / e.target is the current hover target.


        me.classList.add('over');
    }

    function handleDragLeave(e, me) {
        me.classList.remove('over');  // this / e.target is previous target element.
    }

    function handleDrop(e, me) {
        if (e.stopPropagation) {
            e.stopPropagation(); // stops the browser from redirecting.
        }
        e.preventDefault();  
        e.stopPropagation();
        // Set the source column's HTML to the HTML of the column we dropped on.
        console.log(me.innerHTML);
        // dragSrcEl.innerHTML = me.innerHTML;

        // transfer information
        
        $.get("/class_search/", {
            'courseId': courseId,
            'classType': classType,
        }, function(data) {
            var steams = data.streams;

            var col = $(me).data('col');
            var row = $(me).data('row');

            var index_str = which_stream_index_from_col_row(streams,col,row);

            var i = index_str.split('|')[0];
            var j = index_str.split('|')[1];

            if ($(me).hasClass('hasClass')) {
                alert("Time occupied");
            } else {
                if (click_on_class_flag[0]) {
                    var start_col = click_on_class_flag[1];
                    var start_row = click_on_class_flag[2];
                    // console.log(click_on_class_flag);
                    remove_class_all_stream_from_timetable(start_col, start_row);
                }
                $.get("/timetable_have_classtype_this_course/",
                    {
                        'courseId':  streams[i][0]['name'],
                        'classType': streams[i][0]['classtype'],
                    },
                    function (data) {
                        if ((click_on_class_flag[0] == 1) || (data.have_this_classtype == 0)) {
                            click_on_class_flag[0] = 0;
                            for (var k = 0; k < streams[i].length; k++){
                                add_class_to_timetable(streams[i][k]);
                                add_class_to_backend(streams[i][k]);
                            }
                            // $(me).addClass('hasClass');
                        } else {
                            alert("You already have this class in your timetable.");
                        }
                    }
                );
            }

            $('td').each(function() {
                if (!$(this).hasClass('hasClass')) {
                    $(this).removeClass('draggable');
                }
                $(this).removeClass('dropzone');
                $(this).removeClass('first_hour');
                $(this).removeClass('middle_hours');
                $(this).removeClass('last_hour');
                $(this).removeClass('individual');
            });
        });

        me.classList.remove('over');
        $('td').removeClass('tableClassSelectingAvail');
        return false;
    }

    function handleDragEnd(e, me) {
        // this/e.target is the source node.
        // $(me).removeClass('over');
        // [].forEach.call(elems, function (elem) {
        //     elem.classList.remove('over');
        // });
    }

    // $('body').on('dragstart', '.dropzone', function(elem) {
    //     handleDragStart(elem);
    // });
    $('body').on('dragenter', '.dropzone', function(elem) {
        handleDragEnter(elem, this);
    });
    $('body').on('dragover', '.dropzone', function(elem) {
        handleDragOver(elem, this);
    });
    $('body').on('dragleave', '.dropzone', function(elem) {
        handleDragLeave(elem, this);
    });
    $('body').on('drop', '.dropzone', function(elem) {
        handleDrop(elem, this);
    });
    $('body').on('dragend', '.dropzone', function(elem) {
        handleDragEnd(elem, this);
    });
    $('body').on('drop dragend', function() {
        $('td').each(function() {
            $(this).removeClass('dropzone');
            $(this).removeClass('first_hour');
            $(this).removeClass('middle_hours');
            $(this).removeClass('last_hour');
            $(this).removeClass('individual');
        });
    });

    $('body').on('dragstart', '.draggable', function(elem) {
        handleDragStart(elem, this);
    });
    // Download timetable

    $('body aside.sidebar-right-collapse center button.btn#download_timetable').on('click',
        function() {
            // console.log('export timetable');
            html2canvas($('#TimeTable'),{
                onrendered: function(canvas) {
                    // document.body.appendChild(canvas);
                    window.open(canvas.toDataURL('image/png',0.5));
                }
            });
        }
    );

    $('body table#TimeTable tbody').on("mouseover","td.hasClass.1st_hour",
        function(){
            // console.log($(this).data('class_info'));
            var class_info = $(this).data('class_info')
            $('body center#class_info p#my_class_info').html("Location: "+class_info['room']+", "+"&emsp;"+"Enrols: "+class_info['enrols']+"/"+class_info['capacity']);
        }
    );
    $('body table#TimeTable tbody').on("mouseout","td.hasClass.1st_hour",
        function(){
            // console.log("mouse off class");
            $('body center#class_info p#my_class_info').empty();
        }
    );

    $('body table#TimeTable tbody').on("mouseover","td",
        function(){
            $(this).find('div.hasFriendsClass').each(function () {
                // console.log($(this).parent().data('friend_class_info'));
                var class_info = $(this).data('friend_class_info');
                var username = $(this).data('friend_username');
                $('body center#class_info').append("<p id='"+username+"_class_info' >"+username+"'s&ensp;"+class_info['name']+"&ensp;"+class_info['classtype']+"&ensp;at&ensp;"+class_info['room']+"</p>");
            });
        }
    );
    $('body table#TimeTable tbody').on("mouseout","td",
        function(){
            // console.log("mouse off class");
            $(this).find('div.hasFriendsClass').each(function () {
                // console.log($(this).parent().data('friend_class_info'));
                var class_info = $(this).data('friend_class_info');
                var username = $(this).data('friend_username');
                $(this).removeData('friend_class_info');
                $(this).removeData('riend_username');
                $('body center#class_info').find('p#'+username+"_class_info").remove();
            });
        }
    );

    $('body aside.sidebar-left-collapse div#clear_timetable_button p').on('click',
        function (){
            $('body table#TimeTable td.hasClass.1st_hour').each(
                function () {
                    // console.log($(this).data('col')+","+$(this).data('row'));
                    // console.log($(this).data('class_info'));
                    remove_this_class_stream_from_timetable($(this).data('class_info'));
                }
            );
        }
    );

});


