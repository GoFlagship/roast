export const BadCard = (props: any) => {
  return (
    <div className="card">
      <div className="card-body">
        <section className="wrapper">
          <article className="content">
            <div className="nested-box">
              <span className="inner-text">
                <p>{props.title}</p>
                <button onClick={() => {
                  if (props.canDelete) {
                    console.log("deleting...");
                    props.onDelete();
                  }
                }}>
                  Elimina
                </button>
              </span>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};