'use strict';

// URL config:
var BPMN_EDITOR_URL = 'https://broton.sc-hub.de/bpmnjs',
    CAMUNDA_REST_URL = 'https://broton.sc-hub.de/engine-rest',
    REST_GET_PROCESS_DEFS = '/process-definition?latestVersion=true',
    REST_DEPLOY_CREATE = '/deployment/create';

// more config:
var DEPLOYMENT_SOURCE = 'process application',
    PRIMARY_COLOR = '#3e9b52';

// URL Parameters:
var PARAM_COMMENT_MODE = 'commentMode',
    PARAM_PROCESS_ID = 'processId';


// requires:

var templates = require('../resources/element-templates/templates.json');
// inlined diagram; load it from somewhere else if you like
var newDiagramXML = require('../resources/newDiagram.bpmn');
//var newDiagramXML = require('../resources/pizza-collaboration.bpmn');


var Viewer = require('bpmn-js'),
    MoveCanvas = require('diagram-js/lib/navigation/movecanvas'),
//    Modeler = require('bpmn-js/lib/Modeler'),       // default modeler
    CustomModeler = require('./custom-modeler'),    // our custom modeler
    EmbeddedComments = require('bpmn-js-embedded-comments');

var $ = require('jquery');

// main vars:

var canvas,
    container = $('#js-drop-zone'),
    renderer,
    currentProcessId,
    currentProcessKey,
    currentProcessName,
    currentProcessXml;


// properties Panel:
var propertiesPanelModule = require('bpmn-js-properties-panel'),
//    var propertiesPanelModule = require('./custom-properties-panel'),
    propertiesProviderModule = require('bpmn-js-properties-panel/lib/provider/camunda'),
    camundaModdleDescriptor  = require('camunda-bpmn-moddle/resources/camunda');



function init() {
    var commentParam = getURLParameter(PARAM_COMMENT_MODE),
        processId = getURLParameter(PARAM_PROCESS_ID);

    // set author for comments:
//    EmbeddedComments.author.setAuthor('horst');

    console.log('processId: '+processId);

    initEditMode();

    if(processId) {
        getProcessXmlById(processId);

        if(commentParam=='true') {
            setTimeout( toggleCommentMode, 600);
        }
    }
}

function initEditMode() {
    canvas = $('#js-canvas').empty();

    renderer = new CustomModeler({
        container: canvas,
        keyboard: {bindTo: document},
        additionalModules: [
            propertiesPanelModule,
    //      propertiesPanelConfig
            propertiesProviderModule
        ],
        elementTemplates: templates,
        moddleExtensions: {camunda: camundaModdleDescriptor},
        propertiesPanel: {
            parent: '#js-properties-panel'
        }
    });

    if(currentProcessXml) {
        openDiagram(currentProcessXml, currentProcessId);
    }
}

function initCommentMode() {
    canvas = $('#js-canvas').empty();

    renderer = new Viewer({
        container: canvas,
        additionalModules: [
            EmbeddedComments,
            MoveCanvas
        ],
        elementTemplates: templates,
        moddleExtensions: {camunda: camundaModdleDescriptor}
    });

    renderer.importXML(currentProcessXml, function (err) {
        if (err) {
            container
                .removeClass('with-diagram')
                .addClass('with-error');
            container.find('.error pre').text(err.message);
            console.error(err);
        } else {
            container
                .removeClass('with-error')
                .addClass('with-diagram');
        }
    });

    renderer.get('canvas').zoom('fit-viewport');
    renderer.on('comments.updated', commentUpdated);
    renderer.on('selection.changed', selectionChanged);
}


function createNewDiagram() {
    openDiagram(newDiagramXML);
}

function openDiagram(xml, processId) {
    if(processId)
        currentProcessId = processId;
    else {
        currentProcessId = null;
        currentProcessKey = null;
    }

    currentProcessXml = xml;

    showCommentModeButton(true);

    renderer.importXML(xml, function (err) {

        if (err) {
            container
                .removeClass('with-diagram')
                .addClass('with-error');

            container.find('.error pre').text(err.message);

            console.error(err);
        } else {
            container
                .removeClass('with-error')
                .addClass('with-diagram');
        }
        //---------------
        //var elementRegistry = renderer.get('elementRegistry');
        //
        //var sequenceFlowElement = elementRegistry.get('ServiceTask_1q12ne6'),
        //    sequenceFlow = sequenceFlowElement.businessObject;
        //console.log(sequenceFlowElement);
        //console.log(sequenceFlow);
        //console.log(sequenceFlow.$type); // 'YES'
        //console.log( sequenceFlow.conditionExpression); // ModdleElement { $type: 'bpmn:FormalExpression', ... }
    });
}

function saveSVG(done) {
    renderer.saveSVG(done);
}

function saveDiagram(done) {

    renderer.saveXML({format: true}, function (err, xml) {
        done(err, xml);
    });
}


/*
 *  Sends an HTTP request with the given method (GET, POST, ...) to the
 *  given URL, executing the given callback on receiving a response.
 *  If a payload object is given, it will be sent as JSON.
 *  In case of an error the "error" property is set on the response,
 *  containing a message.
 */
function sendRequest(method, url, callback, payload, formData) {
    var xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    //xhr.responseType = 'json';

    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4) {
          if(xhr.status == 200)  {
            callback(JSON.parse(xhr.response));
          } else {
            console.log('Camunda tab:\n'
            + 'Error ' + xhr.status + ': ' + xhr.statusText);

            var message = new Object();
            message.error = 'Error ' + xhr.status + ': ' + xhr.statusText;
            callback(message);
          }
        }
    }

    if(payload) {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
    } else if(formData) {
        xhr.send(formData);
    } else {
        xhr.send();
    }
}

/* Camunda Calls: */

function getProcessDefinitions() {
    var camundaBox = getDialogBox();
    camundaBox.innerHTML = '<div class="table-div">'
            + '<div class="table-vertical-middle">'
                + '<span class="fa fa-spinner fa-spin"></span>'
            + '</div>'
        + '</div>';
    camundaBox = null;

    var url = CAMUNDA_REST_URL + REST_GET_PROCESS_DEFS;
    sendRequest('GET', url, showProcessDefinitions);
}

function showProcessDefinitions(data) {
    var liElement,
        html = $('<ul>');

    if(data && data.length) {
        for(var i=0, j=data.length; i < j; i++) {
            liElement = $('<li>').text(data[i].name);
            liElement.click([data[i].id, data[i].key], getProcessXml);

            html.append(liElement);
        }
    }

    /* test:
    for(var x=0; x < 15; x++) {
        html.append($('<li>').text('test'));
    } */
    
    $('#camunda-bpmns').empty()
        .append($('<p>').text('Choose a Workflow to edit:'))
        .append(html);
}

function getProcessXmlById(id) {
    var arr = {
        data: [ id, '' ]
    };
    getProcessXml(arr);
}
function getProcessXml(event) {
    var id = event.data[0],
        key = event.data[1],
        url = CAMUNDA_REST_URL + '/process-definition/'+ id + '/xml';

    currentProcessKey = key;

    sendRequest('GET', url, useProcessXml);
}

function useProcessXml(data) {
    showOverlay(false);

    if(data && data.bpmn20Xml) {
        openDiagram(data.bpmn20Xml, data.id);
    } else
        console.log('Error!');
}

// deploy:

function deployCurrentBPMNAction(event) {
    event.preventDefault();
    if(event.data)
        currentProcessName = $(event.data).val();
    else if(currentProcessId)
        currentProcessName = currentProcessId;

    // get xml:
    saveDiagram(function (err, xml) {
        deployCurrentBPMN(err ? null : xml);
    });
}
function saveNewVersionOfCurrentBPMN(event) {
    event.preventDefault();
    if(getProcessName() !== currentProcessKey) {
        showErrorBox(getDialogBox(), '<strong>Do not change the process id</strong>'
            +'<br />when saving a new version of a workflow.<br /><br />'
            +'If you want to deploy a completely new workflow instead, please use the deploy button.');
    } else {
        currentProcessName = currentProcessKey;

        // get xml:
        saveDiagram(function (err, xml) {
            deployCurrentBPMN(err ? null : xml);
        });
    }
}
function deployCurrentBPMN(xml) {
    if(xml && xml!==null) {
        var url = CAMUNDA_REST_URL + REST_DEPLOY_CREATE,
            theForm = $('#camunda-deploy-form');

        /*
        theForm.attr('action', url);
        theForm.append(
            $('<input>')
                .attr('name', 'deployment-name')
                .val(currentProcessName)
        );
        */

        var blob = new Blob([xml], {type: 'application/octet-stream'}),
            pseudoFile = new File([xml], currentProcessName+'.bpmn', {type: 'text/xml'}),
            formData = new FormData();
        formData.append('deployment-name', currentProcessName);
        formData.append('deployment-source', DEPLOYMENT_SOURCE);
        formData.append('data', pseudoFile);

        sendRequest('POST', url, deployCurrentBPMNCallback, null, formData);

    } else {
         $('#camunda-bpmns').empty().append(
            $('<div>').addClass('table-div').append(
                $('<div>').addClass('table-vertical-middle  error-box')
                        .text('Error: Could not get XML.')
            )
        );
    }
}

function deployCurrentBPMNCallback(data) {
    console.log(data);
    if(data && data.name) {
        showSuccessBox(getDialogBox(), 'Successfully deployed process <strong>'+ data.name+'</strong>.');
    } else {
        showErrorBox(getDialogBox(), 'Error: Could not deploy process.');
    }
    
}

/* helper */

function getDialogBox() {
    return showOverlay(true);
}
function showOverlay(isVisible) {
    if(isVisible) {
        $('#overlay').css('display', 'block')
            .append(
                $('<div>').addClass('close').append(
                    $('<span>').addClass('fa fa-times-circle')
                        .click(function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            showOverlay(false);
                        })
                )
            );

        return $('#camunda-bpmns').empty().css('display', 'block');
    } else {
        $('#overlay').css('display', 'none');
        $('#camunda-bpmns').empty().css('display', 'none');
    }
}

function showErrorBox(overlayBox, html) {
    $(overlayBox).empty().append(
        $('<div>').addClass('table-div').append(
            $('<div>').addClass('table-vertical-middle error-box')
                    .html( html )
        )
    );
}

function showSuccessBox(overlayBox, html) {
     $(overlayBox).empty().append(
        $('<div>').addClass('table-div').append(
            $('<div>').addClass('table-vertical-middle success-box')
                    .html( html )
        )
    );
}

function getProcessName() {
    var root = renderer.get('canvas').getRootElement();
    if(root.id)
        return root.id;
    else
        return '';
}


/* activity: */

function sendActivity(commenterId, processId) {
    var url = SHINDIG_URL + ACTIVITY_FRAG +commenterId+"/@self";
    
    var payload = createMessageActivity(message, msgId);
    
    sendAsyncRequest('POST', url, showActivityState, payload);
}

function createMessageActivity(commenterId, commenterName, processId, processName) {
        
    var commentId = '',
        url = BPMN_EDITOR_URL + '?'+PARAM_PROCESS_ID+'='+processId + '&'+PARAM_COMMENT_MODE+'=true';
    
    var json = {
            "actor" : {
                "id" : commenterId,
                "displayName" : commenterName,
                "objectType" : "person"
            },
            "generator" : {
                "id" : "bpmnjs",
                "displayName" : "BPMN Editor",
                "objectType" : "application",
            },
            "object" : {
                "id" : commentId,
                "displayName" : "Kommentar",
                "objectType" : "comment",
            },
            "target" : {
                "id": processId,
                "displayName": processName,
                "objectType": "bpmn-process",
                "url": url
            },
            "verb" : "add"
        };
    
    return json;
}

function showActivityState(data) {
    console.log(JSON.stringify(data));
}



/* comment mode: */

var commentModeOn = false;


function showCommentModeButton(show) {
    var parPar = $('#comment-mode-btn').parent().parent();

    if(show) {
        if(parPar.hasClass('hidden')) {
            parPar.css('display', 'inline-block')
                .removeClass('hidden');

            $('#comment-mode-btn')
                .click(function(e) {
                    e.preventDefault();

                    toggleCommentMode();
                }
            );
        }
    } else {
         parPar.css('display', 'none')
            .addClass('hidden');
    }

}

function toggleCommentMode() {
    if(commentModeOn===true) { // set comment mode off:
        commentModeOn = false;

        $('#js-properties-panel').empty();
        
        initEditMode();

        renderer.on('commandStack.changed', exportArtifacts);

        $('#comment-mode-btn').css('color', '');       
    } else { // set comment mode on:        
        commentModeOn = true;
        initCommentMode();

        $('#js-properties-panel').prepend(
            $('<div class="locked-overlay">')
        );

        $('#comment-mode-btn').css('color', PRIMARY_COLOR);
    }
}

function commentUpdated(event) {
    /*
    console.log(event);
    var comments = event.comments;
    */
    exportArtifacts();
}

function selectionChanged(event) {
    // focus textarea when element is selected in comment mode.
    if(event.newSelection && event.newSelection[0] && event.newSelection[0].id) {
        var elId = event.newSelection[0].id;
        $('.djs-overlay-container').children( 'div[data-container-id="'+elId+'"]' ).find('textarea').focus();
    }
}


/* url parameters: */

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}


/* file drop */

function registerFileDrop(container, callback) {

    function handleFileSelect(e) {
        e.stopPropagation();
        e.preventDefault();

        var files = e.dataTransfer.files;

        var file = files[0];

        var reader = new FileReader();

        reader.onload = function (e) {

            var xml = e.target.result;

            callback(xml);
        };

        reader.readAsText(file);
    }

    function handleDragOver(e) {
        e.stopPropagation();
        e.preventDefault();

        e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    container.get(0).addEventListener('dragover', handleDragOver, false);
    container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
    window.alert(
        'Looks like you use an older browser that does not support drag and drop. ' +
        'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
    registerFileDrop(container, openDiagram);
}



// Export:

function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);
    if (data) {
        link.addClass('active').attr({
            'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
            'download': name
        });
    } else {

        link.removeClass('active');
    }
}


var _ = require('lodash'),
    downloadLink = $('#js-download-diagram'),
    downloadSvgLink = $('#js-download-svg');

var exportArtifacts = _.debounce(function () {
    var saveName = 'diagram',
        processName = getProcessName();

    if(processName !== '' && processName !== 'Process_1')
        saveName = processName;

    saveSVG(function (err, svg) {
        setEncoded(downloadSvgLink, saveName+'.svg', err ? null : svg);
    });

    saveDiagram(function (err, xml) {
        setEncoded(downloadLink, saveName+'.bpmn', err ? null : xml);
    });

    // save current xml
    saveDiagram(function (err, xml) {
        if(xml)
            currentProcessXml = xml;
    });

    $('#js-bpmn-to-camunda-btn').addClass('active');
    if(currentProcessKey) {
        $('#js-bpmn-save-version-btn').addClass('active').css('display', 'inline')
            .click(saveNewVersionOfCurrentBPMN);
    }
}, 500);


// On ready:

$(document).on('ready', function () {
    // Import:
    $('#js-create-diagram').click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        createNewDiagram();
    });
    $('#js-create-diagram-btn').click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        createNewDiagram();
    });

    $('#js-bpmn-from-camunda').click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        showOverlay(true);
        getProcessDefinitions();
    });
    $('#js-bpmn-from-camunda-btn').click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        showOverlay(true);
        getProcessDefinitions();
    });


    $('#js-open-file-dir').click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        var input = $('#file-dir-input');
        input.trigger('click');
    });
    $('#js-open-file-dir-btn').click(function (e) {
        e.stopPropagation();
        e.preventDefault();

        var input = $('#file-dir-input');
        input.trigger('click');
    });

    $("#file-dir-input").change(function() {
        var file, reader, xml,
            files = this.files;

        if(files && files.length > 0) {
            file = files[0];
            reader = new FileReader();
            reader.onload = function (e) {
                xml = e.target.result;
                openDiagram(xml);
            };
            reader.readAsText(file);
        }
    });

    // Export:

    $('#js-bpmn-to-camunda-btn').click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        var box = getDialogBox(),
            key = getProcessName(),
            nameInput;

        if(!key) key = '';

        $(box).append(
                $('<div>')
                .css('display', 'table').css('width', '100%').css('height', '100%').css('text-align', 'center')
                .append(
                    $('<div>')
                    .css('display', 'table-cell').css('vertical-align', 'middle')
                    .append(
                        $('<label>').text('Process Key / Deploy Name'),
                        nameInput = $('<input>').attr('value', key),
                        $('<br />'),
                        $('<a href>')
                            .click(nameInput, deployCurrentBPMNAction)
                            .attr('title', 'Deploy BPMN to Camunda')
                            .append($('<span>').addClass('fa fa-cloud-upload'))
                    )
                )
            );

    });   
        

    $('.io-export a').click(function (e) {
        if (!$(this).is('.active')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });  

    renderer.on('commandStack.changed', exportArtifacts);
});


init();