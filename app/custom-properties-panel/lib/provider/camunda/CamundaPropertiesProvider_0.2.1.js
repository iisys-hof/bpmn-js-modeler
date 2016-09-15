'use strict';


var inherits = require('inherits');
var PropertiesActivator = require('bpmn-js-properties-panel/lib/PropertiesActivator');

// bpmn properties
var processProps = require('bpmn-js-properties-panel/lib/provider/bpmn/parts/ProcessProps'),
    eventProps = require('bpmn-js-properties-panel/lib/provider/bpmn/parts/EventProps'),
    linkProps = require('bpmn-js-properties-panel/lib/provider/bpmn/parts/LinkProps'),
    documentationProps = require('bpmn-js-properties-panel/lib/provider/bpmn/parts/DocumentationProps'),
    idProps = require('bpmn-js-properties-panel/lib/provider/bpmn/parts/IdProps');

// camunda properties
var serviceTaskDelegateProps = require('./parts/ServiceTaskDelegateProps'),
    userTaskProps = require('bpmn-js-properties-panel/lib/provider/camunda/parts/UserTaskProps'),
    asynchronousContinuationProps = require('bpmn-js-properties-panel/lib/provider/camunda/parts/AsynchronousContinuationProps'),
    callActivityProps = require('bpmn-js-properties-panel/lib/provider/camunda/parts/CallActivityProps'),
    multiInstanceProps = require('bpmn-js-properties-panel/lib/provider/camunda/parts/MultiInstanceLoopProps'),
    jobRetryTimeCycle = require('bpmn-js-properties-panel/lib/provider/camunda/parts/JobRetryTimeCycle'),
    sequenceFlowProps = require('bpmn-js-properties-panel/lib/provider/camunda/parts/SequenceFlowProps'),
    executionListenerProps = require('bpmn-js-properties-panel/lib/provider/camunda/parts/ExecutionListenerProps'),
    scriptProps = require('bpmn-js-properties-panel/lib/provider/camunda/parts/ScriptTaskProps'),
    serviceTaskDescriptor = require('./ServiceTaskDescriptor.json');

function DefaultPropertiesProvider(eventBus, bpmnFactory, elementRegistry) {
    PropertiesActivator.call(this, eventBus);

    this.getGroups = function (element) {

        var generalGroup = {
            id: 'general',
            label: 'General',
            entries: []
        };
        idProps(generalGroup, element, elementRegistry);
        processProps(generalGroup, element);

        var detailsGroup = {
            id: 'details',
            label: 'Details',
            entries: []
        };

        //Our custom code
        function getAvailableJavaClassesForDelegate() {
            //set DropDown values for the JavaDelegate Classes
            var dropDownValues = [];
            for (var i = 0; i < serviceTaskDescriptor.serviceTasks.length; i++) {
                var def = serviceTaskDescriptor.serviceTasks[i];
                dropDownValues.push([def.label, def.class]);
                //dropDownValues[i][1] = def.class;
            }
            //console.log(dropDownValues.length + ":" + JSON.stringify(dropDownValues, null, "  "));
            return dropDownValues;
        }

        serviceTaskDelegateProps(detailsGroup, element, getAvailableJavaClassesForDelegate());
        //---------------------
        userTaskProps(detailsGroup, element);
        scriptProps(detailsGroup, element, bpmnFactory);
        linkProps(detailsGroup, element);
        callActivityProps(detailsGroup, element);
        eventProps(detailsGroup, element, bpmnFactory);
        sequenceFlowProps(detailsGroup, element, bpmnFactory);

        var multiInstanceGroup = {
            id: 'multiInstance',
            label: 'Multi Instance',
            entries: []
        };
        multiInstanceProps(multiInstanceGroup, element, bpmnFactory);

        var asyncGroup = {
            id: 'asyncGroup',
            label: 'Asynchronous Continuations',
            entries: []
        };
        asynchronousContinuationProps(asyncGroup, element, bpmnFactory);
        jobRetryTimeCycle(asyncGroup, element, bpmnFactory);

        var listenerGroup = {
            id: 'listener',
            label: 'Listener',
            entries: []
        };
        executionListenerProps(listenerGroup, element, bpmnFactory);

        var documentationGroup = {
            id: 'documentation',
            label: 'Documentation',
            entries: []
        };
        documentationProps(documentationGroup, element, bpmnFactory);

        return [
            generalGroup,
            detailsGroup,
            multiInstanceGroup,
            asyncGroup,
            listenerGroup,
            documentationGroup
        ];
    };
}

inherits(DefaultPropertiesProvider, PropertiesActivator);

module.exports = DefaultPropertiesProvider;
