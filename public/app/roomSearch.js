function revertSearchDisplay() {
  $('#map').css('visibility', 'hidden');
  $('.dark-table').show();
  // $('.cancel-search div').toggle({ effect: "scale", direction: "vertical" });
  closeFloatingMenu();
}

// Handles informing the user that their meeting room search has filtered out all results.
function checkAndHandleNoResults() {
  var visibleCells = $('.dark-table tr').filter(function() {
    return $(this).css('display') !== 'none';}
  );
  var firstVisibleCell = visibleCells[0];
  if (!firstVisibleCell) { // Case: we have no visible cells. Display that there are no valid results
    $('.dark-table').prepend("<tr id='no_results'><td>No results</td></tr>")
  } else if (visibleCells.length > 1) {
    $('#no_results').remove();
  } // else do nothing
}

function searchTable() {
  filteredSearch();
  checkAndHandleNoResults();
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
