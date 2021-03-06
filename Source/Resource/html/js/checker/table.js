var checkerTable = (function() {
    var result;

    // Waiting loop ID value
    var waitingLoopId = null;

    // Avoid call to checker status if it's already running
    var checkerStatusInProgress = false;

    var init = function() {
        result = $('#result-table').DataTable({
            order: [0, 'asc'],
            autoWidth: false,
            fixedHeader: {
                headerOffset: $('#mco-navbar').outerHeight(true)
            },
            columnDefs: [
                { orderable: true, targets: 0 },
                { orderable: true, searchable: false, targets: [1, 2] },
                { width: '15%', targets: [1, 2] },
            ]
        });

        statusCell.init(result);
        implementationCell.init(result);
        resultRowHoverBinding();
        addExisting();
    };

    // Redraw the table
    var draw = function() {
        result.draw(false);
    };

    // Clear the table
    var clear = function() {
        result.clear().draw();
    };

    // Based on https://stackoverflow.com/a/41629420
    var jumpToPageContainingResultId = function(id) {
        var node = result.row('#result-' + id).node();
        var page = Math.floor(
            result.rows({
                page: 'all',
                order: 'current',
                search: 'applied'
            }).nodes().indexOf( node ) / result.page.info().length
        );
        result.page(page).draw(false);
    }

    var updateFileOrAddFile = function(fileName, fileId, formValues) {
        if (!result.$('tr.fileId-' + fileId).length) {
            addFile(fileName, fileId, formValues)
        }
        else {
            updateFile(fileId, formValues)
        }
    };

    var updateFile = function(fileId, formValues) {
    };

    var addFile = function(fileName, fileId, formValues) {
        var fileNameSplitted = fileName.split('/');
        if (fileNameSplitted !== undefined)
            fileNameSplitted = fileNameSplitted.pop();
        else
            fileNameSplitted = "";
        var node = result.row.add( [ '<span title="' + fileName + '">' + textUtils.truncate(fileNameSplitted, 28) + '</span>',
            '',
            '<span class="statusResult">In queue</span><div class="statusButton hidden"> \
            <button type="button" class="btn btn-link result-reload hidden" title="Reload result (force analyze)"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button> \
            <button type="button" class="btn btn-link result-close" title="Close result"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button></div>'
        ] ).node();
        var nodej = $(node);

        // Add id
        nodej.prop('id', 'result-' + fileId);
        nodej.addClass('fileId-' + fileId);
        nodej.data('fileId', fileId);

        // Change status class
        $(result.cell(node, 2).node()).addClass('statusCell info');

        // Close button
        nodej.find('.result-close').click(node, function(e) {
            var id = $(result.row(e.data).node()).data('fileId');
            checkerAjax.closeElement(id);
            result.row(e.data).remove().draw(false);

            // Remove close all button
            if (1 == $('table.checker-results tbody tr').length && $('table.checker-results tbody tr .dataTables_empty').length) {
                $('#checkerResultTitle .close').addClass('hidden');
                $('#checkerApplyAll').addClass('hidden');
            };
        });

        // Reload button
        nodej.find('.result-reload').click(node, function(e) {
            var id = $(result.row(e.data).node()).data('fileId');

            // Remove associatedFiles if any
            result.$('tr').filter(function() {
                if ($(this).data('parentId') == id) {
                    result.row($(this)).remove();
                }
            });

            resetRow(id);
            checkerAjax.forceAnalyze(id);
        });

        if ($('#checkerResultTitle .close').hasClass('hidden')) {
            $('#checkerResultTitle .close').removeClass('hidden');
            $('#checkerApplyAll').removeClass('hidden');
        }

        return node;
    };

    var resetRow = function(id) {
        statusCell.reset(id);
        implementationCell.reset(id);

        implementationCell.removeModalIfExists(id);
    };

    var startWaitingLoop = function() {
        stopWaitingLoop();
        waitingLoop(100, 1000);
    }

    var stopWaitingLoop = function() {
        if (null !== waitingLoopId) {
            clearTimeout(waitingLoopId);
            waitingLoopId = null;
        }
    }

    var waitingLoop = function(time, iteration) {
        // Increase delay for the loop after 1st iteration
        if (null === waitingLoopId) {
            time = 500;
        }
        waitingLoopId = setTimeout(function() {
            var nbProcess = 0;
            var nbProcessInProgress = 0;
            var nbProcessLimit = 10;
            var fileIds = [];
            // Process visible results first
            if ($('.statusCell.info').size() > 0) {
                $.each($('.statusCell.info'), function(index, waitingNode) {
                    if (!$(waitingNode).hasClass('checkInProgress')) {
                        if (nbProcess++ < nbProcessLimit) {
                            fileIds.push($(waitingNode).parent().data('fileId'));
                        }
                    }
                    else {
                        if (nbProcessInProgress++ < nbProcessLimit) {
                            fileIds.push($(waitingNode).parent().data('fileId'));
                        }
                    }
                })
            }
            // Process hidden results
            else {
                result.cells('.statusCell.info').every(function(currentCell) {
                    if (!$(this.node()).hasClass('checkInProgress')) {
                        if (nbProcess++ < nbProcessLimit) {
                            fileIds.push($(result.row(currentCell).node()).data('fileId'));
                        }
                    }
                    else {
                        if (nbProcessInProgress++ < nbProcessLimit) {
                            fileIds.push($(result.row(currentCell).node()).data('fileId'));
                        }
                    }
                })
            }

            // Send IDs to server if not already running
            if (fileIds.length > 0 && !checkerStatusInProgress) {
                checkerAjax.checkerStatus(fileIds);
            }

            // Call the loop again
            if (result.cells('.statusCell.info').count() > 0 && --iteration > 0) {
                // Increase loop delay each fifty iteration
                if (0 == iteration % 50 && time < 10000) {
                    time += 500;
                }
                waitingLoop(time, iteration);
            }
            else {
                waitingLoopId = null;
            }

            // Display error for unfinished cells
            if (iteration <= 0) {
                result.cells('.statusCell.info').every(function(currentCell) {
                    statusCell.error($(this.node()).data('fileId'));
                })
            }

        }, time);
    };

    var processCheckerStatusRequest = function(statusMulti) {
        var reports = [];
        $.each(statusMulti, function(statusFileId, status) {
            if (status.finish) {
                var node = result.$('#result-' + statusFileId);
                // Report type
                node.data('tool', status.tool);

                // Status
                statusCell.success(statusFileId);

                // Implementation only
                implementationCell.addSpinnerToCell(statusFileId);

                reports.push({id: statusFileId, tool: status.tool});

                // Handle associated files (attachments)
                if (undefined !== status.associatedFiles) {
                    $.each(status.associatedFiles, function(associatedFileId, associatedFileName) {
                        var nodeFile = addFile(associatedFileName, associatedFileId, checker.getDataFromForm($('.tab-content .active form')));
                        $(nodeFile).data('parent-id', statusFileId).find('.result-reload').remove();
                    });
                    draw();
                }
            }
            else if (status.percent > 0) {
                statusCell.inProgress(statusFileId, status);
            }
            else if (status.error) {
                statusCell.error(statusFileId);
            }
        });

        if (reports.length > 0) {
            checkerAjax.statusReportsMulti(reports);
        }
    };

    var setCheckerStatusInProgress = function(status) {
        checkerStatusInProgress = status;
    };

    var resultRowHoverBinding = function() {
        result.on('draw.dt', function() {
            result.$('tr').off('mouseenter');
            result.$('tr').off('mouseleave');

            // Display buttons on checker result
            result.$('tr').on('mouseenter', function() {
                $(this).find('.statusResult').addClass('hidden');
                $(this).find('.statusButton').removeClass('hidden').parent().addClass('text-center');
                $(this).find('.implemResult').addClass('hidden');
                $(this).find('.implemButton').removeClass('hidden').parent().addClass('text-center');
            });
            result.$('tr').on('mouseleave', function() {
                $(this).find('.statusButton').addClass('hidden').parent().removeClass('text-center');
                $(this).find('.statusResult').removeClass('hidden');
                $(this).find('.implemButton').addClass('hidden').parent().removeClass('text-center');
                $(this).find('.implemResult').removeClass('hidden');
            });
        });
    };

    var addExisting = function() {
        checkerAjax.addExisting();
    };

    return {
        init: init,
        draw: draw,
        clear: clear,
        jumpToPageContainingResultId: jumpToPageContainingResultId,
        startWaitingLoop: startWaitingLoop,
        updateFileOrAddFile: updateFileOrAddFile,
        processCheckerStatusRequest: processCheckerStatusRequest,
        setCheckerStatusInProgress: setCheckerStatusInProgress,
        addExisting: addExisting,
    };
})();
