const bodybuilder = require("bodybuilder");
const parameter = require("./constant");

// const filter = {
//   values: {
//     title: ["Essence Mascara Lash Princess"],
//     category: ["beauty"],
//     tags: ["beauty", "mascara"],
//     dimensions: {
//       width: 23.17,
//       height: 14.43,
//       depth: 28.01
//     }
//   },
//   nested: {
//     reviews: []
//   },
//   range: {
//     price: { gte: 10, lte: 100 }
//   },
//   values_not: {},
//   multi_match: {},
//   range_not: {}
// };

// const generateQuery = (filter) => {
//   let query = bodybuilder();

//   if (filter.values.title && filter.values.title.length > 0) {
//     query = query.query("prefix", "title", filter.values.title);
//   }

//   if (filter.values.genre && filter.values.genre.length > 0) {
//     query = query.orFilter("terms", "genre", filter.values.genre);
//   }

//   if (filter.range) {
//     for (const [field, range] of Object.entries(filter.range)) {
//       query = query.filter("range", field, range);
//     }
//   }

//   if (filter.values_not) {
//     for (const [field, values] of Object.entries(filter.values_not)) {
//       query = query.notFilter("terms", field, values);
//     }
//   }

//   if (filter.range_not) {
//     for (const [field, range] of Object.entries(filter.range_not)) {
//       query = query.notFilter("range", field, range);
//     }
//   }
//   return query.build();
// };

const fieldKeyword = ["title", "warrantyInformation"];

module.exports.generateQuery = async (filter, name_Of_Index) => {
  let query = bodybuilder();

  if (filter.values) {
    for (const field in filter.values) {
      const values = filter.values[field];

      if (Array.isArray(values) && values.length > 0) {
        if (fieldKeyword.includes(field)) {
          query = query.query(parameter.terms, `${field}`, values);
        } else {
          query = query.query(parameter.terms, field, values);
        }
      } else if (typeof values === "object" && values !== null) {
        for (const nestedField in values) {
          const nestedValue = values[nestedField];

          query = query.query("match", `${field}.${nestedField}`, nestedValue);
        }
      }
    }
  }

  if (filter.values_or) {
    for (const field in filter.values_or) {
      const nor_values = filter.values_or[field];
      if (Array.isArray(nor_values) && nor_values.length > 0) {
        query = query.orFilter(parameter.terms, field, nor_values);
      }
    }
  }

  if (filter.nested) {
    for (const nestedField in filter.nested) {
      const nestedValues = filter.nested[nestedField];
      if (nestedValues && nestedValues.length > 0) {
        for (const nestedValue of nestedValues) {
          for (const key in nestedValue) {
            const value = nestedValue[key];
            query = query.query(parameter.nested, {
              path: nestedField,
              query: bodybuilder()
                .query(parameter.term, `${nestedField}.${key}`, value)
                .build().query
            });
          }
        }
      }
    }
  }

  if (filter.range) {
    for (const field in filter.range) {
      const range = filter.range[field];
      if (range.includes("|") && typeof range === "string") {
        const [gte, lte] = range.split("|").map(Number);
        query = query.filter(parameter.range, field, { gte, lte });
      }
    }
  }

  if (filter.values_not) {
    for (const field in filter.values_not) {
      const notValues = filter.values_not[field];
      if (Array.isArray(notValues) && notValues.length > 0) {
        if (fieldKeyword.includes(field)) {
          query = query.notFilter(
            parameter.terms,
            `${field}.keyword`,
            notValues
          );
        } else {
          query = query.notFilter(parameter.terms, field, notValues);
        }
      }
    }
  }

  if (filter.multi_match) {
    const { fields, query: multiMatchQuery } = filter.multi_match;
    if (fields && multiMatchQuery) {
      // Add the multi_match query
      query = query.query(parameter.multi_match, {
        query: multiMatchQuery,
        fields: fields
      });
    }
  }

  if (filter.range_not) {
    for (const field in filter.range_not) {
      const notRange = filter.range_not[field];

      query = query.notFilter(parameter.range, field, notRange);
    }
  }

  if (filter.all_aggregation) {
    for (const field in filter.all_aggregation) {
      const range_of_agg = filter.all_aggregation[field];
      query = query.aggregation(field, range_of_agg);
    }
  }

  console.log("----successfully----");
  const buildQuery = query.build();

  const esQuery = {
    index: name_Of_Index,
    body: buildQuery,
    size: 100,
    from: 0
  };

  return esQuery;
};

module.exports.addQuery = async (body, name_Of_Index) => {
  const esQuery = {
    index: name_Of_Index,
    body: body
  };

  return esQuery;
};

module.exports.updateQuery = async (body, id, name_Of_Index) => {
  const esQuery = {
    index: name_Of_Index,
    id: id,
    body: { doc: body }
  };

  return esQuery;
};

module.exports.byQueryUpdate = async (body, name_Of_Index) => {
  const query = body.query;
  const params = body.params;

  let bb = bodybuilder();

  if (query.id) {
    bb.query(parameter.match, "id", query.id);
  }

  const esQuery = bb.build();

  const scriptSource = Object.keys(params)
    .map((key) => `ctx._source.${key} = params.${key};`)
    .join(" ");

  const esUpdateByQuery = {
    index: name_Of_Index,
    body: {
      script: {
        source: scriptSource,
        lang: "painless",
        params: params
      },
      query: esQuery.query
    }
  };

  return esUpdateByQuery;
};

module.exports.deleteQuery = async (id, name_Of_Index) => {
  const esQuery = {
    index: name_Of_Index,
    id: id
  };

  return esQuery;
};

module.exports.byQueryDelete = async (body, name_Of_Index) => {
  const query = body.query;

  let bb = bodybuilder();

  if (query.id) {
    bb.query(parameter.match, "id", query.id);
  }

  const esQuery = bb.build();

  const esUpdateByQuery = {
    index: name_Of_Index,
    query: esQuery.query
  };

  return esUpdateByQuery;
};

module.exports.removeFieldQuery = async (body, name_Of_Index) => {
  const query = body.query;
  const params = body.params;

  let bb = bodybuilder();

  if (query.id) {
    bb.query(parameter.match, "id", query.id);
  }

  const esQuery = bb.build();

  // const scriptSource = Object.keys(params)
  //   .map(
  //     (field) =>
  //       `if (ctx._source.containsKey('${field}')) { {for (int i=0;i<ctx._source.reviews.length;i++)ctx._source.reviews[i].remove('${field}');} }`
  //   )
  //   .join(" ");

  const reviewsToRemove = params.reviews; // Array of fields to remove
  const scriptSource = `
    if (ctx._source.containsKey('reviews')) {
      for (int i = ctx._source.reviews.length - 1; i >= 0; i--) {
        def review = ctx._source.reviews[i];
        for (String field : params.fields) {
          if (review.containsKey(field)) {
            review.remove(field);
          }
        }
      }
    }
  `;

  const esUpdateByQuery = {
    index: name_Of_Index,
    body: {
      script: {
        scriptSource
        // source: `if (ctx._source.containsKey('reviews')) { for (int i=0;i<ctx._source.reviews.length;i++) { ctx._source.reviews[i].remove(\"${params}\")} }`
      },
      query: esQuery.query
    }
  };
  // console.log(esUpdateByQuery);

  return esUpdateByQuery;
};

exports.removeField = async (fieldName, id, nameOfIndex, req, res) => {
  try {
    const esQuery = {
      index: nameOfIndex,
      id: id,
      body: {
        script: {
          source: `ctx._source.remove('${fieldName}')`
        }
      }
    };

    const response = await global.elasticDB.update(esQuery);

    return res.status(200).json({
      status: "Success",
      message: `${fieldName} removed successfully`,
      data: response
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: "Internal error while removing field",
      error: error.message
    });
  }
};


