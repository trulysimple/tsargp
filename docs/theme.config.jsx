export default {
  logo: <span>tsargp</span>,
  project: {
    link: 'https://github.com/trulysimple/tsargp',
  },
  docsRepositoryBase: 'https://github.com/trulysimple/tsargp/tree/main/docs',
  footer: {
    text: (
      <span>
        MIT {new Date().getFullYear()} ©{' '}
        <a href="https://trulysimple.dev" target="_blank">
          TrulySimple
        </a>
        .
      </span>
    ),
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s - tsargp - TrulySimple',
    };
  },
};
