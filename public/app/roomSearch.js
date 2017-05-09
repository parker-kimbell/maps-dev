
// Handles informing the user that their meeting room search has filtered out all results.
function checkAndHandleNoResults() {
  var visibleRows = getVisibleRows();
  var firstVisibleRow = visibleRows[0];
  if (!firstVisibleRow) { // Case: we have no visible cells. Display that there are no valid results
    $('.dark-table').prepend("<tr id='no_results'><td>No results</td></tr>")
  } else if (visibleRows.length > 1) {
    $('#no_results').remove();
  } // else do nothing
}

function searchTable() {
  filteredSearch();
  applyPaddingFirstChild();
  removeBorderLastChild();
  checkAndHandleNoResults();
}

function getVisibleRows() {
  return $('.dark-table tr').filter(function() {
    return $(this).css('display') !== 'none';
  });
}

function applyPaddingFirstChild() {
  var visibleRows = getVisibleRows();
  $.each(visibleRows, function(i, row) {
    if (i === 0) { // We're viewing the first visible row
      $(row).find('td').css('padding-top', '20px');
    } else { // Otherwise we're not the first row, so set the padding top to default
      $(row).find('td').css('padding-top', '8px');
    }
  });
}

/*
  keeps the border state for the table such that the last visible row never has
  a bottom border
*/
function removeBorderLastChild() {
  var visibleRows = getVisibleRows();
  $.each(visibleRows, function(i, row) {
    if (i !== visibleRows.length - 1) {
      $(row).find('td div').css('border-bottom', '1px solid #979797');
    } else {
      $(row).find('td div').css('border-bottom', 'none');
    }
  });
}

function filteredSearch() {
  var currVal = $('#active_search_input').val().toUpperCase();
  var searchTableCells = $('.dark-table tr td div');

  for (var i = 0; i < searchTableCells.length; i++) {
    var cell = $(searchTableCells[i]);
    if (cell.html().toUpperCase().indexOf(currVal) > -1) {
      cell.closest('tr').show();
    } else {
      cell.closest('tr').hide();
    }
  }
}

module.exports = {
  filteredSearch : filteredSearch,
  searchTable : searchTable
}
