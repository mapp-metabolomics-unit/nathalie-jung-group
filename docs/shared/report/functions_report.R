# This is a function to create an interactive table. See more details at (https://martinctc.github.io/blog/vignette-downloadable-tables-in-rmarkdown-with-the-dt-package/


create_dt <- function(x) {
  DT::datatable(x,
    extensions = "Buttons",
    filter = "top",
    escape = FALSE, # to have active html and links
    options = list(
      dom = "Blfrtip",
      buttons = c("copy", "csv", "excel"),
      lengthMenu = list(
        c(10, 25, 50, -1),
        c(10, 25, 50, "All")
      ),
      scrollX = "300px"
    )
  )
}


# This function is to create the associated caption to a DT table

create_dt_cap <- function(caption, chunklabel) {
  cat("<table width=100%>", paste0(
    "<caption>",
    paste("(#tab:", chunklabel, ")", sep = ""),
    paste("", caption, "", sep = ""),
    "</caption>"
  ),
  "</table>",
  sep = "\n"
  )
}

# This function is a wrapper to create a DT table and its caption

create_dt_wrapper <- function(x, caption, chunklabel) {
  create_dt_cap(caption, chunklabel)
  create_dt(x)
}

# This function select columns required to plot a Plotly treemap in R and applies the appropriate formating for its display.
# See here for details <!-- https://stackoverflow.com/a/74174857 -->

dt_for_treemap <- function(datatable, parent_value, value, count) {
  parent_value <- enquo(parent_value)
  value <- enquo(value)
  count <- enquo(count)

  datatable <- data.frame(datatable %>%
    group_by(!!parent_value, !!value, ) %>%
    summarise(count = sum(as.numeric(!!count))))

  datatable <- datatable %>%
    select(!!parent_value, !!value, count) %>% # create id labels for each row # Notre the !! to pass aruguments to a dplyr function
    rename(
      parent.value = !!parent_value,
      value = !!value
    ) %>%
    mutate(ids = ifelse(parent.value == "", value,
      paste0(value, "-", parent.value) # Notre that here we are passing argument to a non dplyr function call
    )) %>%
    select(ids, everything())

  par_info <- datatable %>% dplyr::group_by(parent.value) %>% # group by parent
    dplyr::summarise(count = sum(as.numeric(count))) %>% # parent total
    rename(value = parent.value) %>% # parent labels for the item field
    mutate(parent.value = "", ids = value) %>% # add missing fields for my_data
    select(names(datatable)) # put cols in same order as my_data

  data_for_plot <- rbind(datatable, par_info)

  return(data_for_plot)
}

plotly_treemap <- function(datatable, parent_value, value, count) {
  parent_value <- enquo(parent_value)
  value <- enquo(value)
  count <- enquo(count)

  datatable <- datatable %>%
    select(!!parent_value, !!value, !!count) %>% # create id labels for each row # Notre the !! to pass aruguments to a dplyr function
    rename(
      parent.value = !!parent_value,
      value = !!value,
      count = !!count,
    ) %>%
    mutate(ids = ifelse(parent.value == "", value,
      paste0(value, "-", parent.value) # Notre that here we are passing argument to a non dplyr function call
    )) %>%
    select(ids, everything())

  par_info <- datatable %>% dplyr::group_by(parent.value) %>% # group by parent
    dplyr::summarise(count = sum(as.numeric(count))) %>% # parent total
    rename(value = parent.value) %>% # parent labels for the item field
    mutate(parent.value = "", ids = value) %>% # add missing fields for my_data
    select(names(datatable)) # put cols in same order as my_data

  data_for_plot <- rbind(datatable, par_info)

  fig <- plot_ly(
    data = data_for_plot, branchvalues = "total",
    type = "treemap", labels = ~value,
    parents = ~parent.value, values = ~count, ids = ~ids
  )

  return(fig)
  # return(data_for_plot)
}



plotly_two_treemaps <- function(datatable, parent_value, value, count, fig_1) {
  parent_value <- enquo(parent_value)
  value <- enquo(value)
  count <- enquo(count)

  datatable <- datatable %>%
    select(!!parent_value, !!value, !!count) %>% # create id labels for each row # Notre the !! to pass aruguments to a dplyr function
    rename(
      parent.value = !!parent_value,
      value = !!value,
      count = !!count,
    ) %>%
    mutate(ids = ifelse(parent.value == "", value,
      paste0(value, "-", parent.value) # Notre that here we are passing argument to a non dplyr function call
    )) %>%
    select(ids, everything())

  par_info <- datatable %>% dplyr::group_by(parent.value) %>% # group by parent
    dplyr::summarise(count = sum(as.numeric(count))) %>% # parent total
    rename(value = parent.value) %>% # parent labels for the item field
    mutate(parent.value = "", ids = value) %>% # add missing fields for my_data
    select(names(datatable)) # put cols in same order as my_data

  data_for_plot <- rbind(datatable, par_info)

  fig_1 <- fig_1 %>% layout(domain = list(column = 0))

  fig <- fig_1 %>% add_trace(
    data = data_for_plot, branchvalues = "total",
    type = "treemap", labels = ~value,
    parents = ~parent.value, values = ~count, ids = ~ids,
    domain = list(column = 1)
  )

  fig <- fig %>% layout(grid = list(columns = 2, rows = 1))
  return(fig)
}

# This function is used to colorize text in R Markdown output (HTML and PDF)
# See here for details <!-- https://bookdown.org/yihui/rmarkdown-cookbook/font-color.html#using-an-r-function-to-write-raw-html-or-latex-code -->

colorize <- function(x, color) {
  if (knitr::is_latex_output()) {
    # here we remove the # sign and CAPITALIZE the color name
    # see https://tex.stackexchange.com/a/18009
    color <- toupper(gsub("#", "", color))
    sprintf("\\textcolor[HTML]{%s}{%s}", color, x)
  } else if (knitr::is_html_output()) {
    sprintf(
      "<span style='color: %s;'>%s</span>", color,
      x
    )
  } else {
    x
  }
}
